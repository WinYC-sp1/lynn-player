use anyhow::Result;
use chrono::{DateTime, Utc};
use lofty::file::AudioFile;
use lofty::prelude::*;
use rayon::prelude::*;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use walkdir::WalkDir;

use crate::library::Track;
use crate::library::DB;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgress {
    pub total_files: usize,
    pub processed_files: usize,
    pub new_tracks: usize,
    pub updated_tracks: usize,
    pub removed_tracks: usize,
    pub current_file: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ScanStatus {
    Idle,
    Scanning,
    Completed(ScanProgress),
    Error(String),
}

struct ScanState {
    progress: Mutex<ScanProgress>,
    status: Mutex<ScanStatus>,
    should_cancel: Mutex<bool>,
}

static SCAN_STATE: once_cell::sync::Lazy<ScanState> = once_cell::sync::Lazy::new(|| ScanState {
    progress: Mutex::new(ScanProgress {
        total_files: 0,
        processed_files: 0,
        new_tracks: 0,
        updated_tracks: 0,
        removed_tracks: 0,
        current_file: None,
    }),
    status: Mutex::new(ScanStatus::Idle),
    should_cancel: Mutex::new(false),
});

#[tauri::command]
pub fn get_scan_status() -> Result<ScanStatus, String> {
    Ok(SCAN_STATE.status.lock().unwrap().clone())
}

#[tauri::command]
pub fn get_scan_progress() -> Result<ScanProgress, String> {
    Ok(SCAN_STATE.progress.lock().unwrap().clone())
}

#[tauri::command]
pub fn cancel_scan() -> Result<(), String> {
    *SCAN_STATE.should_cancel.lock().unwrap() = true;
    Ok(())
}

fn is_supported_audio_file(path: &Path) -> bool {
    let supported_extensions: HashSet<String> = ["mp3", "flac", "wav", "ogg", "m4a", "aac", "wma"]
        .into_iter()
        .map(|s| s.to_string())
        .collect();

    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| supported_extensions.contains(&ext.to_lowercase()))
        .unwrap_or(false)
}

fn collect_audio_files(root_path: &Path) -> Result<Vec<PathBuf>> {
    let mut files = Vec::new();

    for entry in WalkDir::new(root_path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.is_file() && is_supported_audio_file(path) {
            files.push(path.to_path_buf());
        }
    }

    Ok(files)
}

fn read_track_metadata(path: &Path, last_modified: i64) -> Result<Track> {
    let tagged_file = lofty::read_from_path(path)?;
    let file_size = std::fs::metadata(path)?.len() as i64;

    let properties = tagged_file.properties();
    let duration = properties.duration().as_secs_f64();

    let tag = tagged_file.first_tag().ok_or_else(|| anyhow::anyhow!("No tag found"))?;

    let title = tag
        .title()
        .map(|t| t.to_string())
        .unwrap_or_else(|| {
            path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("Unknown")
                .to_string()
        });

    let artist = tag.artist().map(|t| t.to_string()).unwrap_or("Unknown".to_string());
    let album = tag.album().map(|t| t.to_string()).unwrap_or("Unknown".to_string());
    let genre = tag.genre().map(|t| t.to_string()).unwrap_or("".to_string());
    let year = tag.year().map(|y| y as i32);
    let track_number = tag.track().map(|t| t as i32);

    let now = Utc::now();

    Ok(Track {
        id: 0,
        title,
        artist,
        album,
        genre,
        year,
        duration,
        track_number,
        file_path: path.to_string_lossy().to_string(),
        file_size,
        last_modified,
        created_at: now,
        updated_at: now,
    })
}

fn load_existing_tracks_map(conn: &Connection) -> Result<HashMap<String, (i64, i64)>> {
    let mut stmt = conn.prepare("SELECT id, file_path, last_modified FROM tracks")?;
    let tracks = stmt.query_map([], |row| {
        Ok((row.get(1)?, (row.get(0)?, row.get(2)?)))
    })?;

    let mut map = HashMap::new();
    for track in tracks {
        let (path, (id, last_modified)) = track?;
        map.insert(path, (id, last_modified));
    }

    Ok(map)
}

fn batch_insert_or_update_tracks(conn: &Connection, tracks: Vec<Track>) -> Result<()> {
    let now = Utc::now().to_rfc3339();

    for track in tracks {
        let existing_id: Option<i64> = conn
            .query_row(
                "SELECT id FROM tracks WHERE file_path = ?1",
                params![track.file_path],
                |row| row.get(0),
            )
            .optional()?;

        if let Some(id) = existing_id {
            conn.execute(
                "UPDATE tracks SET
                    title = ?2, artist = ?3, album = ?4, genre = ?5, year = ?6,
                    duration = ?7, track_number = ?8, file_size = ?9,
                    last_modified = ?10, updated_at = ?11
                WHERE id = ?1",
                params![
                    id,
                    track.title,
                    track.artist,
                    track.album,
                    track.genre,
                    track.year,
                    track.duration,
                    track.track_number,
                    track.file_size,
                    track.last_modified,
                    now
                ],
            )?;
        } else {
            conn.execute(
                "INSERT INTO tracks (
                    title, artist, album, genre, year, duration, track_number,
                    file_path, file_size, last_modified, created_at, updated_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?11)",
                params![
                    track.title,
                    track.artist,
                    track.album,
                    track.genre,
                    track.year,
                    track.duration,
                    track.track_number,
                    track.file_path,
                    track.file_size,
                    track.last_modified,
                    now
                ],
            )?;
        }
    }

    Ok(())
}

fn remove_missing_tracks(conn: &Connection, existing_paths: &HashSet<String>) -> Result<usize> {
    let mut stmt = conn.prepare("SELECT id, file_path FROM tracks")?;
    let tracks = stmt.query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?;

    let mut to_remove = Vec::new();
    for track in tracks {
        let (id, path): (i64, String) = track?;
        if !existing_paths.contains(&path) {
            to_remove.push(id);
        }
    }

    for id in &to_remove {
        conn.execute("DELETE FROM tracks WHERE id = ?1", params![id])?;
    }

    Ok(to_remove.len())
}

#[tauri::command]
pub fn optimized_scan_library(path: String) -> Result<Vec<Track>, String> {
    let root_path = Path::new(&path);
    if !root_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    *SCAN_STATE.status.lock().unwrap() = ScanStatus::Scanning;
    *SCAN_STATE.should_cancel.lock().unwrap() = false;

    let conn = DB.conn.lock().unwrap();

    let existing_tracks_map = load_existing_tracks_map(&conn).map_err(|e| e.to_string())?;

    let audio_files = collect_audio_files(root_path).map_err(|e| e.to_string())?;

    {
        let mut progress = SCAN_STATE.progress.lock().unwrap();
        progress.total_files = audio_files.len();
        progress.processed_files = 0;
        progress.new_tracks = 0;
        progress.updated_tracks = 0;
        progress.removed_tracks = 0;
    }

    let (files_to_process, files_to_keep): (Vec<_>, Vec<_>) = audio_files
        .into_iter()
        .partition(|path| {
            let path_str = path.to_string_lossy().to_string();
            if let Some((_, existing_modified)) = existing_tracks_map.get(&path_str) {
                if let Ok(metadata) = std::fs::metadata(path) {
                    if let Ok(modified) = metadata.modified() {
                        let secs = modified
                            .duration_since(std::time::UNIX_EPOCH)
                            .ok()
                            .map(|d| d.as_secs() as i64)
                            .unwrap_or(0);
                        return secs != *existing_modified;
                    }
                }
                return false;
            }
            true
        });

    let processed_results: Vec<_> = files_to_process
        .into_par_iter()
        .filter_map(|path| {
            if *SCAN_STATE.should_cancel.lock().unwrap() {
                return None;
            }

            let path_str = path.to_string_lossy().to_string();
            {
                let mut progress = SCAN_STATE.progress.lock().unwrap();
                progress.current_file = Some(path_str.clone());
            }

            let result = (|| -> Result<Option<Track>> {
                let metadata = std::fs::metadata(&path)?;
                let last_modified = metadata
                    .modified()?
                    .duration_since(std::time::UNIX_EPOCH)
                    .ok()
                    .map(|d| d.as_secs() as i64)
                    .unwrap_or(0);

                let track = read_track_metadata(&path, last_modified)?;

                Ok(Some(track))
            })();

            {
                let mut progress = SCAN_STATE.progress.lock().unwrap();
                progress.processed_files += 1;
            }

            result.ok().flatten()
        })
        .collect();

    let mut existing_paths: HashSet<String> = files_to_keep
        .iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect();
    
    for track in &processed_results {
        existing_paths.insert(track.file_path.clone());
    }

    let removed_count = remove_missing_tracks(&conn, &existing_paths).map_err(|e| e.to_string())?;

    batch_insert_or_update_tracks(&conn, processed_results).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, title, artist, album, genre, year, duration, track_number,
                    file_path, file_size, last_modified, created_at, updated_at
             FROM tracks ORDER BY artist, album, track_number",
        )
        .map_err(|e| e.to_string())?;

    let tracks = stmt
        .query_map([], |row| {
            let created_at_str: String = row.get(11)?;
            let updated_at_str: String = row.get(12)?;
            let created_at = DateTime::parse_from_rfc3339(&created_at_str)
                .map_err(|e| rusqlite::Error::InvalidColumnName(e.to_string()))?
                .with_timezone(&Utc);
            let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
                .map_err(|e| rusqlite::Error::InvalidColumnName(e.to_string()))?
                .with_timezone(&Utc);
            Ok(Track {
                id: row.get(0)?,
                title: row.get(1)?,
                artist: row.get(2)?,
                album: row.get(3)?,
                genre: row.get(4)?,
                year: row.get(5)?,
                duration: row.get(6)?,
                track_number: row.get(7)?,
                file_path: row.get(8)?,
                file_size: row.get(9)?,
                last_modified: row.get(10)?,
                created_at,
                updated_at,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    {
        let mut progress = SCAN_STATE.progress.lock().unwrap();
        progress.removed_tracks = removed_count;
    }

    *SCAN_STATE.status.lock().unwrap() = ScanStatus::Completed(SCAN_STATE.progress.lock().unwrap().clone());

    Ok(tracks)
}
