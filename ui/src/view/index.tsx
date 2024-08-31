import React from 'react';
import { WASM_CONTROLLER } from '../wasm-controller';
import { Col, Row } from './styled';
import { Views } from './views';
import styled from 'styled-components';
import { Values } from './values';
import { ErrorBoundary } from './error-boundary';
import { ResetButton } from './reset-button';

const Container = styled(Col)`
    max-width: 1000px;
    margin: 0 auto;
`;

const Main = () => {
    const onAdvanceTime = () => {
        const newTime = BigInt(Date.now());
        console.log(`Advancing time to: ${newTime}`);
        WASM_CONTROLLER.sendInputs([{ AdvanceTo: newTime }]).catch((e) => {
            console.error('Failed to send inputs, error: ', e);
        });
    };
    const onStep = () => {
        WASM_CONTROLLER.sendInputs(['StepUntilComplete']).catch((e) => {
            console.error('Failed to send inputs, error: ', e);
        });
    };

    return (
        <Container>
            <Values />
            <Views />
            <Col>
                <Row $alignItems={'center'}>
                    <button onClick={onAdvanceTime}>Advance time</button>
                    <button onClick={onStep}>Step</button>
                    <ResetButton />
                </Row>
            </Col>
        </Container>
    );
};

const ErrorFallback = () => {
    return (
        <Col $alignItems={'start'}>
            <div>Something went wrong during rendering, check the console for errors. Try resetting the app.</div>
            <ResetButton />
        </Col>
    );
};

export default () => {
    return (
        <ErrorBoundary fallback={<ErrorFallback />}>
            <Main />
        </ErrorBoundary>
    );
};
