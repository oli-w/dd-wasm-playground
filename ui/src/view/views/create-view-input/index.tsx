import React, { useEffect, useState } from 'react';
import { WASM_CONTROLLER } from '../../../wasm-controller';
import { View, WasmInput } from 'wasm-dataflow/bindings';
import { Col } from '../../styled';

const validateViewJsonAsInput = async (viewJson: string): Promise<View> => {
    const view: View = JSON.parse(viewJson);
    const input: WasmInput = { CreateView: view };
    await WASM_CONTROLLER.validateInput(input);
    return view;
};

type ValidationState = { valid: true; view: View } | { valid: false; error: string };
export const CreateViewInput = ({ onCreated, views }: { onCreated: (newView: View) => void; views: View[] }) => {
    const [view, setView] = useState('');
    const [validationState, setValidationState] = useState<ValidationState | null>(null);
    useEffect(() => {
        if (view.trim().length === 0) {
            setValidationState(null);
            return;
        }

        validateViewJsonAsInput(view)
            .then((view) => {
                if (views.some((existingView) => view.key === existingView.key)) {
                    setValidationState({ valid: false, error: `View with key '${view.key}' already exists` });
                } else {
                    setValidationState({ valid: true, view });
                }
            })
            .catch((error) => {
                setValidationState({ valid: false, error: String(error) });
            });
    }, [view]);

    const onCreateView = async () => {
        if (validationState !== null && validationState.valid) {
            const newView = validationState.view;
            WASM_CONTROLLER.sendInputs([
                { CreateView: newView },
                { AdvanceTo: BigInt(Date.now()) },
                'StepUntilComplete',
            ]).then(() => {
                onCreated(newView);
                setView('');
            });
        }
    };

    return (
        <Col>
            <textarea
                cols={50}
                rows={5}
                value={view}
                onChange={(e) => setView(e.target.value)}
                placeholder={`{ "key": "view-1", "query_key": "key-1" }`}
            />
            {validationState !== null && !validationState.valid && <div>{String(validationState.error)}</div>}
            <div>
                <button onClick={onCreateView} disabled={validationState === null || !validationState.valid}>
                    Create
                </button>
            </div>
        </Col>
    );
};
