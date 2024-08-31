use std::cell::RefCell;
use std::collections::HashMap;

use log::info;
use serde_wasm_bindgen::Error;
use wasm_bindgen::prelude::*;

use crate::input::WasmInput;
use crate::utils::set_panic_hook;
use crate::worker_controller::{OutputCallback, WorkerController};

mod input;
mod output;
mod types;
mod utils;
mod worker_controller;

thread_local! {
    pub static NEXT_KEY: RefCell<u32> = const { RefCell::new(1) };
    // Usually we only need a singleton for the current page load, but we keep a map in case
    // multiple are initialized due to hot reloading in dev
    pub static WORKER_CONTROLLERS: RefCell<HashMap<u32, WorkerController>> = RefCell::new(HashMap::new());
}

#[wasm_bindgen(start)]
fn start() {
    // Register the browser's console as the logger for the standard log crate
    console_log::init().unwrap();
    set_panic_hook();
    info!("WASM start() completed");
}

fn parse_inputs(value: JsValue) -> Result<Vec<WasmInput>, Error> {
    serde_wasm_bindgen::from_value::<Vec<WasmInput>>(value)
}

#[wasm_bindgen]
pub fn validate_inputs(value: JsValue) -> Result<(), Error> {
    parse_inputs(value)?;
    Ok(())
}

#[wasm_bindgen]
pub struct WorkerControllerReference(u32);
#[wasm_bindgen]
impl WorkerControllerReference {
    pub fn send_inputs(&self, value: JsValue) -> Result<(), Error> {
        let inputs = parse_inputs(value)?;

        WORKER_CONTROLLERS
            .with_borrow_mut(|worker_controllers| worker_controllers.get_mut(&self.0).unwrap().handle_inputs(inputs));
        Ok(())
    }
}

#[wasm_bindgen]
pub fn create_worker(output_callback: &js_sys::Function) -> WorkerControllerReference {
    let worker_controller = WorkerController::new(OutputCallback(output_callback.clone()));
    let state_key = NEXT_KEY.with_borrow(|state_key| *state_key);
    NEXT_KEY.set(state_key + 1);
    WORKER_CONTROLLERS.with_borrow_mut(|workers| {
        workers.insert(state_key, worker_controller);
    });

    WorkerControllerReference(state_key)
}
