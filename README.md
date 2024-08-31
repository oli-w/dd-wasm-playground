## Prerequisites
Note: all commands are to be run from the root of the repo, unless specified.
* Install `cargo watch`: https://crates.io/crates/cargo-watch.
* Install `nvm` (node version manager): https://github.com/nvm-sh/nvm.
* Run `nvm use` to set the node version for the current shell. Follow the prompts to 
install the specific node version if you don't already have it.
* Enable ESLint in your IDE if available.

## Watch mode for development
* Run `npm install` to install dependencies.
* Run `npm run wasm-dataflow-watch` to build the wasm-dataflow package, and rebuild on 
changes. Leave this running in a separate terminal.
* Navigate to the `ui/` directory (`cd ui`) and run `npm run serve`. This generates the
`index.html` and `main.js` files, serving them from memory, with hot reloading. Leave 
this running in a separate terminal.
* Open http://localhost:8080/ to view the frontend and receive hot reloads.

## Building for publishing
* Run `npm install` if not done already.
* Run `npm run build`. This emits [index.html](./docs/index.html) and [main.js](./docs/main.js) into
the `docs/` directory for static hosting on GitHub Pages (needs to be enabled in repo settings).
* Push to GitHub.

## Generating types
TypeScript types are generated automatically via:
* `#[wasm_bindgen]` annotations, emitted to `wasm-dataflow/pkg/wasm_dataflow.d.ts`.
* `#[derive(TS)]` + `#[ts(export)]` annotations (`ts-rs` crate), emitted to `wasm-dataflow/bindings/`.
  * Update these by running `npm run generate-typescript-bindings` in the `wasm-dataflow/` directory.

## Directory structure
* `ui/`: React + TypeScript code for rendering the UI.
* `wasm-dataflow/`: Rust Crate using wasm-bindgen to generate an NPM package with a WASM executable and 
TypeScript types.

## Tools used
* React for view rendering and state management.
* TypeScript.
* Webpack for bundling + transpiling to JS files.
* ESLint and Prettier for code style.