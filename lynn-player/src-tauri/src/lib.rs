mod library;
mod video;
mod worker_threads;
mod modules;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            video::get_video_metadata,
            video::get_supported_video_formats,
            library::scan_library,
            library::get_all_tracks,
            library::search_tracks,
            library::delete_track,
            library::create_playlist,
            library::get_all_playlists,
            library::update_playlist,
            library::delete_playlist,
            library::add_track_to_playlist,
            library::remove_track_from_playlist,
            library::reorder_playlist_track,
            library::get_playlist_tracks,
            library::get_genres,
            library::get_artists,
            library::get_albums,
            library::get_years,
            worker_threads::init_worker_pool,
            worker_threads::decode_audio_async,
            worker_threads::get_decoder_event,
            worker_threads::clear_audio_cache,
            worker_threads::shutdown_workers,
            modules::optimized_scan::get_scan_status,
            modules::optimized_scan::get_scan_progress,
            modules::optimized_scan::cancel_scan,
            modules::optimized_scan::optimized_scan_library
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
