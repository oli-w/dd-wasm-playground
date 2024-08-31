import { Box, Col, Heading } from '../styled';
import { CreateViewInput } from './create-view-input';
import React, { useState } from 'react';
import { View } from 'wasm-dataflow/bindings';
import { ViewResults } from './view-list';
import { VIEWS_ACCESSOR } from '../../wasm-controller';

export const Views = () => {
    const [views, setViews] = useState<View[]>(VIEWS_ACCESSOR.get());
    const onCreated = (newView: View) => {
        setViews((prevViews) => prevViews.concat([newView]));
    };

    return (
        <>
            <Box>
                <Col>
                    <Heading>Create view</Heading>
                    <div>Enter JSON for view. "key": a unique key for the view. "query_key": the key to query for.</div>
                    <CreateViewInput onCreated={onCreated} views={views} />
                </Col>
            </Box>
            <Box>
                <Col>
                    <Heading>View results</Heading>
                    <ViewResults views={views} />
                </Col>
            </Box>
        </>
    );
};
