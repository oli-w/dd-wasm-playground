import { resolve } from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default {
    entry: {
        main: './src/index.tsx',
    },
    mode: 'development',
    module: {
        rules: [
            // TypeScript .ts/tsx files need to be transpiled into JavaScript for output
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: { transpileOnly: true },
                },
                exclude: /node_modules/,
            },
            // This causes any imported .wasm files to be bundled in as a bas64 encoded string into the main.js file.
            // This results in a large bundle size but greatly simplifies WASM init.
            // Ideally WASM should run in a separate WebWorker but this requires a fair bit of extra setup, including
            // communication between the main thread and worker thread using window.postMessage.
            {
                test: /\.wasm$/,
                type: 'asset/inline',
            },
        ],
    },
    target: 'web',
    output: {
        filename: 'main.js',
        path: resolve(__dirname, '..', 'docs'),
    },
    plugins: [new HtmlWebpackPlugin({
        template: './src/index-template.html'
    })],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
};
