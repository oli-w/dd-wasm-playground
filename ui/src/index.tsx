import React from 'react';
import { createRoot } from 'react-dom/client';
import { default as InitialApp } from './view';

const container = document.getElementById('root')!;
const root = createRoot(container);

const renderApp = (App: any) => {
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
};

// Special syntax for "hot module reloading" - replacing the component on the page without doing a full page refresh
// @ts-expect-error hot
if (module.hot) {
    // @ts-expect-error hot
    module.hot.accept('./view', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const NewApp = require('./view').default;
        renderApp(NewApp);
    });
}

renderApp(InitialApp);
