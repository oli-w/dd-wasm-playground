use serde::Serialize;
use ts_rs::TS;

use crate::types::Diff;

#[derive(TS, Serialize)]
#[ts(export)]
pub struct KeyValueOutput {
    pub key: String,
    pub value: String,
    pub diff: Diff,
}

#[derive(TS, Serialize)]
#[ts(export)]
pub enum WasmOutput {
    Values(Vec<KeyValueOutput>),
    ViewResults { view_key: String, values: Vec<(String, Diff)> },
}
