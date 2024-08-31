import React, { useEffect, useState } from 'react';
import { WASM_CONTROLLER } from '../../../wasm-controller';
import { Box, Col } from '../../styled';
import { KeyValueInput } from 'wasm-dataflow/bindings';

const validateLinesAsInputs = (value: string): KeyValueInput[] => {
    return value
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line): KeyValueInput => {
            const parts = line.split(',');
            if (parts.length !== 3) {
                throw new Error(`Line "${line}" does not match expected format: key,value,diff`);
            }
            const [key, value, diffStr] = parts;
            const diff: number = parseInt(diffStr!, 10);
            if (Number.isNaN(diff)) {
                throw new Error(`Diff for line "${line}" is not numeric`);
            }

            return { key: key!.trim(), value: value!.trim(), diff };
        });
};

type ValidationState = { valid: true; inputChanges: KeyValueInput[] } | { valid: false; error: string };
export const BulkValueInput = () => {
    const [value, setValue] = useState('');
    const [validationState, setValidationState] = useState<ValidationState | null>(null);
    useEffect(() => {
        if (value.trim().length === 0) {
            setValidationState(null);
            return;
        }

        try {
            const inputChanges = validateLinesAsInputs(value);
            setValidationState({ valid: true, inputChanges });
        } catch (error) {
            setValidationState({ valid: false, error: String(error) });
        }
    }, [value]);

    const onAdd = () => {
        if (validationState === null || !validationState.valid) {
            return;
        }

        WASM_CONTROLLER.sendInputs([
            { InputChanges: validationState.inputChanges },
            { AdvanceTo: BigInt(Date.now()) },
            'StepUntilComplete',
        ]).catch((error) => {
            console.error(error, 'Failed to send inputs');
        });
        setValue('');
    };

    return (
        <Box>
            <Col>
                <div>Bulk enter inputs, with each line in the format: key,value,diff</div>
                <textarea
                    rows={5}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={'key1,value1,+1\nkey2,value2,-1'}
                />
                {validationState !== null && !validationState.valid && <div>{validationState.error}</div>}
                <div>
                    <button onClick={onAdd} disabled={validationState === null || !validationState.valid}>
                        Add
                    </button>
                </div>
            </Col>
        </Box>
    );
};
