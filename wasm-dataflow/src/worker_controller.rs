use std::borrow::BorrowMut;

use differential_dataflow::input::{Input, InputSession};
use differential_dataflow::operators::arrange::{ArrangeByKey, TraceAgent};
use differential_dataflow::operators::Reduce;
use differential_dataflow::trace::implementations::ord_neu::OrdValSpine;
use itertools::Itertools;
use log::info;
use timely::communication::allocator::Generic;
use timely::dataflow::operators::probe::Handle;
use timely::dataflow::ProbeHandle;
use timely::worker::Worker;
use wasm_bindgen::JsValue;

use crate::input::{KeyValueInput, View, WasmInput};
use crate::output::{KeyValueOutput, WasmOutput};
use crate::types::{Diff, Time};

#[derive(Clone)]
pub struct OutputCallback(pub js_sys::Function);

impl OutputCallback {
    fn call(&self, outputs: Vec<WasmOutput>) {
        let outputs_js_value = serde_wasm_bindgen::to_value(&outputs).unwrap();
        self.0.call1(&JsValue::NULL, &outputs_js_value).unwrap();
    }
}

struct Inputs(InputSession<Time, (String, String), Diff>);

impl Inputs {
    pub fn time(&self) -> &Time {
        self.0.time()
    }
    fn advance_to(&mut self, time: &Time) {
        self.0.advance_to(*time);
        self.0.flush();
    }
    fn update(&mut self, changes: Vec<KeyValueInput>) {
        for KeyValueInput { key, value, diff } in changes {
            self.0.update((key, value), diff);
        }
    }
}

type KeyValueTrace = TraceAgent<OrdValSpine<String, String, Time, Diff>>;

pub struct WorkerController {
    worker: Worker<Generic>,
    inputs: Inputs,
    probe: Handle<Time>,
    key_value_trace: KeyValueTrace,
    output_callback: OutputCallback,
}

pub const MAX_STEPS: u32 = 1000;

impl WorkerController {
    pub fn new(output_callback: OutputCallback) -> Self {
        let alloc = Generic::Thread(timely::communication::allocator::thread::Thread::new());
        let config = timely::WorkerConfig::default();
        let mut worker = Worker::new(config, alloc, None);
        let (input_session, key_value_trace, probe) = worker.dataflow::<Time, _, _>(|scope| {
            let output_callback = output_callback.clone();
            let mut probe = ProbeHandle::<Time>::new();

            let (input, collection) = scope.new_collection::<(String, String), Diff>();

            // Report the latest state of all key-value inputs.
            // This is not particularly efficient, but convenient to emit this so the UI can simply
            // render the current state
            collection
                .map(|key_value| ((), key_value))
                .reduce(|_, input, output| {
                    let value_entries = input
                        .iter()
                        .map(|((key, value), diff)| (key.clone(), value.clone(), *diff))
                        .collect_vec();
                    output.push((value_entries, 1));
                })
                .map(|(_, value_entries)| value_entries)
                .inspect({
                    let output_callback = output_callback.clone();
                    move |(value_entries, _time, diff)| {
                        // Only emit positive diffs for latest value
                        if diff > &0 {
                            let value_entries = value_entries
                                .clone()
                                .into_iter()
                                .map(|(key, value, diff)| KeyValueOutput { key, value, diff })
                                .collect_vec();
                            output_callback.call(vec![WasmOutput::Values(value_entries)]);
                        }
                    }
                })
                .probe_with(&mut probe);

            let key_value_arranged = collection.arrange_by_key();

            (input, key_value_arranged.trace, probe)
        });
        let inputs = Inputs(input_session);

        Self {
            worker,
            inputs,
            key_value_trace,
            output_callback,
            probe,
        }
    }
    pub fn handle_inputs(&mut self, inputs: Vec<WasmInput>) {
        info!("Received inputs: {:?}", inputs);

        for input in inputs {
            match input {
                WasmInput::InputChanges(input_changes) => self.inputs.update(input_changes),
                WasmInput::AdvanceTo(new_time) => self.advance_time(new_time),
                WasmInput::StepUntilComplete => self.step_until_complete(),
                WasmInput::CreateView(view) => self.create_view(view),
            }
        }
    }
    fn advance_time(&mut self, new_time: Time) {
        self.inputs.advance_to(&new_time);
    }
    fn step_until_complete(&mut self) {
        let mut step_count = 0;
        let new_time = self.inputs.time();
        while self.probe.less_than(&new_time) {
            if step_count >= MAX_STEPS {
                let probe = self
                    .probe
                    .with_frontier(|antichain| antichain.iter().map(|t| format!("{:?}", t)).collect_vec())
                    .join(", ");
                panic!(
                    "Ran {} steps without completing. Probe times: [{}]. New time: [{:?}]",
                    step_count, probe, new_time
                );
            }
            self.worker.borrow_mut().step();
            step_count += 1;
        }
        info!(
            "step_until_complete advanced to time {:?} after {step_count} steps",
            new_time
        );
    }
    fn create_view(&mut self, view: View) {
        let mut worker = self.worker.borrow_mut().clone();
        let output_callback = self.output_callback.clone();
        worker.dataflow::<Time, _, _>(|scope| {
            let View { key, query_key } = view;
            info!("Creating view with key {key}");

            let key_value_collection = self.key_value_trace
                .import(scope)
                .as_collection(|key, value| (key.clone(), value.clone()));
            key_value_collection
                .flat_map(move |(key, value)| if key == query_key { Some(value) } else { None })
                .map(|key_value| ((), key_value))
                .reduce(|_, input, output| {
                    let value_diffs = input.iter().map(|&(value, diff)| (value.clone(), diff)).collect_vec();
                    output.push((value_diffs, 1));
                })
                .map(|(_, matched_values)| matched_values)
                .inspect({
                    let output_callback = output_callback.clone();
                    let view_key = key.clone();
                    move |(value_diffs, _time, diff)| {
                        if diff > &0 {
                            output_callback.call(vec![WasmOutput::ViewResults {
                                view_key: view_key.clone(),
                                values: value_diffs.clone(),
                            }]);
                        }
                    }
                })
                .probe_with(&mut self.probe);


        });
    }
}
