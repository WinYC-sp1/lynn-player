use std::panic;
use std::sync::atomic::{AtomicBool, Ordering};

pub static PANIC_OCCURRED: AtomicBool = AtomicBool::new(false);

pub fn setup_panic_hook() {
    let original_hook = panic::take_hook();
    panic::set_hook(Box::new(move |panic_info| {
        PANIC_OCCURRED.store(true, Ordering::Relaxed);
        let location = panic_info.location()
            .map(|loc| format!("{}:{}:{}", loc.file(), loc.line(), loc.column()))
            .unwrap_or_else(|| "unknown location".to_string());
        let message = panic_info.payload()
            .downcast_ref::<&str>()
            .map(|s| s.to_string())
            .or_else(|| panic_info.payload().downcast_ref::<String>().cloned())
            .unwrap_or_else(|| "unknown panic".to_string());
        eprintln!("Panic occurred at {}: {}", location, message);
        original_hook(panic_info);
    }));
}

pub fn has_panic_occurred() -> bool {
    PANIC_OCCURRED.load(Ordering::Relaxed)
}

pub fn reset_panic_flag() {
    PANIC_OCCURRED.store(false, Ordering::Relaxed);
}
