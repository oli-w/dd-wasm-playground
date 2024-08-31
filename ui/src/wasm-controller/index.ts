import initWasm, { create_worker, validate_inputs, WorkerControllerReference } from 'wasm-dataflow';
import { KeyValueInput, View, WasmInput, WasmOutput } from 'wasm-dataflow/bindings';
import { createLocalStorageAccessor } from '../util/hooks';
import { LOCAL_STORAGE_KEYS } from '../constants';

type Subscription = { unsubscribe: () => void };
type OutputListener = (outputs: WasmOutput[]) => void;

const KEY_VALUE_INPUTS_ACCESSOR = createLocalStorageAccessor<KeyValueInput[]>(LOCAL_STORAGE_KEYS.keyValues, []);
export const VIEWS_ACCESSOR = createLocalStorageAccessor<View[]>(LOCAL_STORAGE_KEYS.views, []);

const reHydrateFromLocalStorage = (workerController: WorkerControllerReference) => {
    const inputs: WasmInput[] = VIEWS_ACCESSOR.get().map((view): WasmInput => ({ CreateView: view }));
    const keyValueInputs = KEY_VALUE_INPUTS_ACCESSOR.get();
    if (keyValueInputs.length > 0) {
        inputs.push({ InputChanges: keyValueInputs });
    }

    if (inputs.length > 0) {
        inputs.push({ AdvanceTo: BigInt(Date.now()) }, 'StepUntilComplete');
        workerController.send_inputs(inputs);
    }
};
const saveInputsToLocalStorage = (inputs: WasmInput[]) => {
    for (const input of inputs) {
        if (typeof input === 'string') {
            continue;
        }

        if ('CreateView' in input) {
            VIEWS_ACCESSOR.set([...VIEWS_ACCESSOR.get(), input.CreateView]);
        } else if ('InputChanges' in input) {
            KEY_VALUE_INPUTS_ACCESSOR.set(KEY_VALUE_INPUTS_ACCESSOR.get().concat(input.InputChanges));
        }
    }
};

class WasmController {
    private readonly workerPromise: Promise<WorkerControllerReference>;
    private readonly receivedOutputs: WasmOutput[];
    private readonly listeners: Record<string, OutputListener>;
    private nextListenerId: number;

    constructor() {
        this.workerPromise = initWasm().then(async () => {
            const worker = create_worker(this.onOutputFromWasm);
            reHydrateFromLocalStorage(worker);
            return worker;
        });
        this.receivedOutputs = [];
        this.listeners = {};
        this.nextListenerId = 1;
    }

    private safelyCallListener = (listener: OutputListener, outputs: WasmOutput[]) => {
        try {
            listener(outputs);
        } catch (error) {
            console.error(error, 'Error calling listener on WASM outputs');
        }
    };
    private onOutputFromWasm = (outputs: WasmOutput[]) => {
        this.receivedOutputs.push(...outputs);
        Object.values(this.listeners).forEach((listener) => {
            this.safelyCallListener(listener, outputs);
        });
    };

    sendInputs = async (inputs: WasmInput[]) => {
        const workerController = await this.workerPromise;
        workerController.send_inputs(inputs);
        saveInputsToLocalStorage(inputs);
    };

    validateInput = async (input: WasmInput) => {
        // await workerPromise to ensure initWasm() has resolved before calling in
        await this.workerPromise;
        validate_inputs([input]);
    };

    registerOutputListener = (listener: OutputListener): Subscription => {
        const listenerId = String(this.nextListenerId++);
        this.listeners[listenerId] = listener;
        if (this.receivedOutputs.length > 0) {
            this.safelyCallListener(listener, this.receivedOutputs);
        }

        return {
            unsubscribe: () => {
                delete this.listeners[listenerId];
            },
        };
    };
}

// Singleton class
export const WASM_CONTROLLER = new WasmController();
