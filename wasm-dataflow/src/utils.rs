// Sets up a hook so that if there is a panic! inside the WASM we get a better stack trace and the
// error message printed to console.error
pub fn set_panic_hook() {
    // For more details see
    // https://github.com/rustwasm/console_error_panic_hook#readme
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}
