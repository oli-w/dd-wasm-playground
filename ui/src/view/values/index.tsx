import { Box, Col, Heading } from '../styled';
import React, { useEffect, useState } from 'react';
import { KeyValues } from './key-values';
import { KeyValueInput } from 'wasm-dataflow/bindings';
import { WASM_CONTROLLER } from '../../wasm-controller';
import { BulkValueInput } from './bulk-value-input';

export const Values = () => {
    // Keep a copy of the key-value entries emitted from WASM in state here
    const [keyValueDiffs, setKeyValues] = useState<KeyValueInput[]>([]);
    useEffect(() => {
        const { unsubscribe } = WASM_CONTROLLER.registerOutputListener((outputs) => {
            for (const output of outputs) {
                if ('Values' in output) {
                    setKeyValues(output.Values);
                }
            }
        });
        return unsubscribe;
    }, []);

    return (
        <Box>
            <Col>
                <Heading>Values</Heading>
                <KeyValues keyValueDiffs={keyValueDiffs} />
                <BulkValueInput />
            </Col>
        </Box>
    );
};
