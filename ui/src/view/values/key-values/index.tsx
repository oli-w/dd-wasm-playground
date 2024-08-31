import React from 'react';
import { KeyValueInput } from 'wasm-dataflow/bindings';
import { Table, Td, Th } from '../../styled';

export const KeyValues = ({ keyValueDiffs }: { keyValueDiffs: KeyValueInput[] }) => {
    if (keyValueDiffs.length === 0) {
        return <div>No values added yet</div>;
    }

    return (
        <Table>
            <thead>
                <tr>
                    <Th>Key</Th>
                    <Th>Value</Th>
                    <Th>Diff</Th>
                </tr>
            </thead>
            <tbody>
                {keyValueDiffs.map(({ key, value, diff }) => (
                    <tr key={`${key}/${value}`}>
                        <Td>{key}</Td>
                        <Td>{value}</Td>
                        <Td>{diff}</Td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
};
