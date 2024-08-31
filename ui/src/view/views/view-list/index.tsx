import React, { useEffect, useState } from 'react';
import { View } from 'wasm-dataflow/bindings';
import { WASM_CONTROLLER } from '../../../wasm-controller';
import { Table, Td, Th } from '../../styled';

export const ViewResults = ({ views }: { views: View[] }) => {
    const [viewResults, setViewResults] = useState<Record<string, [string, number][]>>({});

    useEffect(() => {
        WASM_CONTROLLER.registerOutputListener((outputs) => {
            for (const output of outputs) {
                if ('ViewResults' in output) {
                    const { ViewResults } = output;
                    setViewResults((prevViewResults) => ({
                        ...prevViewResults,
                        [ViewResults.view_key]: ViewResults.values,
                    }));
                }
            }
        });
    }, []);

    if (views.length === 0) {
        return <div>No views created yet</div>;
    }

    return (
        <Table>
            <thead>
                <tr>
                    <Th>View key</Th>
                    <Th>Value</Th>
                    <Th>Diff</Th>
                </tr>
            </thead>
            <tbody>
                {views.flatMap(({ key, query_key }) => {
                    const valueDiffs = viewResults[key] || [];
                    if (valueDiffs.length === 0) {
                        return [
                            <tr key={key}>
                                <Td>
                                    {key} (query_key = {query_key})
                                </Td>
                                <Td colSpan={2}>No values</Td>
                            </tr>,
                        ];
                    }

                    return valueDiffs.map(([value, diff], index) => {
                        const rowKey = `${key}/${value}`;
                        if (index === 0) {
                            return (
                                <tr key={rowKey}>
                                    <Td rowSpan={valueDiffs.length}>
                                        {key} (query_key = {query_key})
                                    </Td>
                                    <Td>{value}</Td>
                                    <Td>{diff}</Td>
                                </tr>
                            );
                        } else {
                            return (
                                <tr key={rowKey}>
                                    <Td>{value}</Td>
                                    <Td>{diff}</Td>
                                </tr>
                            );
                        }
                    });
                })}
            </tbody>
        </Table>
    );
};
