use serde::Deserialize;
use ts_rs::TS;

use crate::types::{Diff, Time};

#[derive(Clone, Debug, TS, Deserialize)]
#[ts(export)]
pub struct KeyValueInput {
    pub key: String,
    pub value: String,
    pub diff: Diff,
}

#[derive(Clone, Debug, TS, Deserialize)]
#[ts(export)]
pub struct View {
    pub key: String,
    pub query_key: String,
}

#[derive(Clone, Debug, TS, Deserialize)]
#[ts(export)]
pub enum WasmInput {
    // Appends inputs at the current time
    InputChanges(Vec<KeyValueInput>),
    // Advances to the target time
    AdvanceTo(Time),
    StepUntilComplete,
    CreateView(View),
}
