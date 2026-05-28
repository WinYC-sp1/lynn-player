use anyhow::{anyhow, Context, Result};
use chrono::{DateTime, Utc};
use lofty::prelude::*;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Track {
    pub id: i64,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub genre: String,
    pub year: Option<i32>,
    pub duration: f64,
    pub track_number: Option<i32>,
    pub file_path: String,
    pub file_size: i64,
    pub last_modified: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Playlist {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchQuery {
    pub query: String,
    pub title: bool,
    pub artist: bool,
    pub album: bool,
    pub genre: bool,
    pub year: Option<i32>,
}

pub struct Database {
    pub conn: Mutex<Connection>,
}

pub static DB: once_cell::sync::Lazy<Database> = once_cell::sync::Lazy::new(|| {
    let path = get_db_path().expect("Failed to get database path");
    let conn = Connection::open(&path).expect("Failed to open database");
    init_db(&conn).expect("Failed to initialize database");
    Database {
        conn: Mutex::new(conn),
    }
});

fn get_db_path() -> Result<PathBuf> {
    let home_dir = dirs::home_dir().ok_or_else(|| anyhow!("Failed to get home directory"))?;
    let app_dir = home_dir.join(".lynn-player");
    std::fs::create_dir_all(&app_dir)?;
    Ok(app_dir.join("library.db"))
}

fn init_db(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            artist TEXT NOT NULL DEFAULT '',
            album TEXT NOT NULL DEFAULT '',
            genre TEXT NOT NULL DEFAULT '',
            year INTEGER,
            duration REAL NOT NULL,
            track_number INTEGER,
            file_path TEXT NOT NULL UNIQUE,
            file_size INTEGER NOT NULL,
            last_modified INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS playlists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS playlist_tracks (
            playlist_id INTEGER NOT NULL,
            track_id INTEGER NOT NULL,
            position INTEGER NOT NULL,
            added_at TEXT NOT NULL,
            PRIMARY KEY (playlist_id, track_id),
            FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
            FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
        );
        CREATE VIRTUAL TABLE IF NOT EXISTS tracks_fts USING fts5(
            title, artist, album, genre,
            content=tracks,
            content_rowid=id
        );
        CREATE INDEX IF NOT EXISTS idx_tracks_file_path ON tracks(file_path);
        CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist);
        CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album);
        CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);
        CREATE INDEX IF NOT EXISTS idx_tracks_year ON tracks(year);
        CREATE TRIGGER IF NOT EXISTS tracks_ai AFTER INSERT ON tracks BEGIN
            INSERT INTO tracks_fts(rowid, title, artist, album, genre)
            VALUES (new.id, new.title, new.artist, new.album, new.genre);
        END;
        CREATE TRIGGER IF NOT EXISTS tracks_ad AFTER DELETE ON tracks BEGIN
            INSERT INTO tracks_fts(tracks_fts, rowid, title, artist, album, genre)
            VALUES('delete', old.id, old.title, old.artist, old.album, old.genre);
        END;
        CREATE TRIGGER IF NOT EXISTS tracks_au AFTER UPDATE ON tracks BEGIN
            INSERT INTO tracks_fts(tracks_fts, rowid, title, artist, album, genre)
            VALUES('delete', old.id, old.title, old.artist, old.album, old.genre);
            INSERT INTO tracks_fts(rowid, title, artist, album, genre)
            VALUES (new.id, new.title, new.artist, new.album, new.genre);
        END;
        ",
    )?;
    Ok(())
}

#[tauri::command]
pub fn scan_library(path: String) -> Result<Vec<Track>, String> {
    let path = Path::new(&path);
    if !path.exists() {
        return Err(format!("Path does not exist: {}", path.display()));
    }

    let supported_extensions: HashSet<String> = ["mp3", "flac", "wav", "ogg", "m4a", "aac", "wma"]
        .into_iter()
        .map(|s| s.to_string())
        .collect();

    let mut new_tracks = Vec::new();

    let existing_files: HashSet<String> = get_all_tracks()
        .map_err(|e| e.to_string())?
        .into_iter()
        .map(|t| t.file_path)
        .collect();

    let mut scanned_files = HashSet::new();

    for entry in WalkDir::new(path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let entry_path = entry.path();
        if entry_path.is_file() {
            if let Some(ext) = entry_path.extension().and_then(|e| e.to_str()) {
                if supported_extensions.contains(&ext.to_lowercase()) {
                    let path_str = entry_path.to_string_lossy().to_string();
                    scanned_files.insert(path_str.clone());

                    if let Ok(metadata) = std::fs::metadata(entry_path) {
                        let last_modified = metadata
                            .modified()
                            .ok()
                            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                            .map(|d| d.as_secs() as i64)
                            .unwrap_or(0);

                        if !existing_files.contains(&path_str) || is_file_updated(&path_str, last_modified)? {
                            if let Ok(track) = read_metadata(entry_path, last_modified) {
                                new_tracks.push(track);
                            }
                        }
                    }
                }
            }
        }
    }

    for file in existing_files.difference(&scanned_files) {
        let _ = delete_track_by_path(file);
    }

    for track in new_tracks.iter() {
        let _ = insert_or_update_track(track.clone());
    }

    get_all_tracks().map_err(|e| e.to_string())
}

fn is_file_updated(file_path: &str, new_last_modified: i64) -> Result<bool, String> {
    let conn = DB.conn.lock().unwrap();
    let last_modified: Option<i64> = conn
        .query_row(
            "SELECT last_modified FROM tracks WHERE file_path = ?1",
            params![file_path],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(last_modified.map_or(true, |lm| lm != new_last_modified))
}

fn read_metadata(path: &Path, last_modified: i64) -> Result<Track> {
    let tagged_file = lofty::read_from_path(path)?;
    let file_size = std::fs::metadata(path)?.len() as i64;

    let properties = tagged_file.properties();
    let duration = properties.duration().as_secs_f64();

    let tag = tagged_file.first_tag().ok_or_else(|| anyhow!("No tag found"))?;

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

fn insert_or_update_track(track: Track) -> Result<Track> {
    let conn = DB.conn.lock().unwrap();
    let now = Utc::now().to_rfc3339();

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
        get_track_by_id(id)
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
        let id = conn.last_insert_rowid();
        get_track_by_id(id)
    }
}

fn get_track_by_id(id: i64) -> Result<Track> {
    let conn = DB.conn.lock().unwrap();
    conn.query_row(
        "SELECT id, title, artist, album, genre, year, duration, track_number,
                file_path, file_size, last_modified, created_at, updated_at
         FROM tracks WHERE id = ?1",
        params![id],
        |row| {
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
        },
    )
    .context("Failed to get track")
}

#[tauri::command]
pub fn get_all_tracks() -> Result<Vec<Track>, String> {
    let conn = DB.conn.lock().unwrap();
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

    Ok(tracks)
}

#[tauri::command]
pub fn search_tracks(query: SearchQuery) -> Result<Vec<Track>, String> {
    let conn = DB.conn.lock().unwrap();

    let mut sql = String::from(
        "SELECT t.id, t.title, t.artist, t.album, t.genre, t.year, t.duration, t.track_number,
                t.file_path, t.file_size, t.last_modified, t.created_at, t.updated_at
         FROM tracks t",
    );

    let mut params: Vec<String> = Vec::new();
    let mut conditions: Vec<String> = Vec::new();

    if !query.query.is_empty() {
        let mut fts_columns = Vec::new();
        if query.title {
            fts_columns.push("title");
        }
        if query.artist {
            fts_columns.push("artist");
        }
        if query.album {
            fts_columns.push("album");
        }
        if query.genre {
            fts_columns.push("genre");
        }
        if fts_columns.is_empty() {
            fts_columns = vec!["title", "artist", "album", "genre"];
        }
        sql.push_str(" JOIN tracks_fts f ON t.id = f.rowid");
        conditions.push(format!(
            "tracks_fts MATCH ?{}",
            params.len() + 1
        ));
        params.push(format!("{}*", query.query));
    }

    if let Some(year) = query.year {
        conditions.push(format!("t.year = ?{}", params.len() + 1));
        params.push(year.to_string());
    }

    if !conditions.is_empty() {
        sql.push_str(" WHERE ");
        sql.push_str(&conditions.join(" AND "));
    }

    sql.push_str(" ORDER BY t.artist, t.album, t.track_number");

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let param_refs: Vec<&str> = params.iter().map(|s| s.as_str()).collect();
    let tracks = stmt
        .query_map(rusqlite::params_from_iter(param_refs), |row| {
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

    Ok(tracks)
}

#[tauri::command]
pub fn delete_track(id: i64) -> Result<(), String> {
    let conn = DB.conn.lock().unwrap();
    conn.execute("DELETE FROM tracks WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn delete_track_by_path(path: &str) -> Result<()> {
    let conn = DB.conn.lock().unwrap();
    conn.execute("DELETE FROM tracks WHERE file_path = ?1", params![path])?;
    Ok(())
}

#[tauri::command]
pub fn create_playlist(name: String, description: Option<String>) -> Result<Playlist, String> {
    let conn = DB.conn.lock().unwrap();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO playlists (name, description, created_at, updated_at) VALUES (?1, ?2, ?3, ?3)",
        params![name, description, now],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    get_playlist_by_id(id)
}

#[tauri::command]
pub fn get_all_playlists() -> Result<Vec<Playlist>, String> {
    let conn = DB.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, name, description, created_at, updated_at FROM playlists ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let playlists = stmt
        .query_map([], |row| {
            let created_at_str: String = row.get(3)?;
            let updated_at_str: String = row.get(4)?;
            let created_at = DateTime::parse_from_rfc3339(&created_at_str)
                .map_err(|e| rusqlite::Error::InvalidColumnName(e.to_string()))?
                .with_timezone(&Utc);
            let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
                .map_err(|e| rusqlite::Error::InvalidColumnName(e.to_string()))?
                .with_timezone(&Utc);
            Ok(Playlist {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at,
                updated_at,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(playlists)
}

fn get_playlist_by_id(id: i64) -> Result<Playlist, String> {
    let conn = DB.conn.lock().unwrap();
    conn.query_row(
        "SELECT id, name, description, created_at, updated_at FROM playlists WHERE id = ?1",
        params![id],
        |row| {
            let created_at_str: String = row.get(3)?;
            let updated_at_str: String = row.get(4)?;
            let created_at = DateTime::parse_from_rfc3339(&created_at_str)
                .map_err(|e| rusqlite::Error::InvalidColumnName(e.to_string()))?
                .with_timezone(&Utc);
            let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
                .map_err(|e| rusqlite::Error::InvalidColumnName(e.to_string()))?
                .with_timezone(&Utc);
            Ok(Playlist {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at,
                updated_at,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_playlist(id: i64, name: String, description: Option<String>) -> Result<Playlist, String> {
    let conn = DB.conn.lock().unwrap();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE playlists SET name = ?2, description = ?3, updated_at = ?4 WHERE id = ?1",
        params![id, name, description, now],
    )
    .map_err(|e| e.to_string())?;

    get_playlist_by_id(id)
}

#[tauri::command]
pub fn delete_playlist(id: i64) -> Result<(), String> {
    let conn = DB.conn.lock().unwrap();
    conn.execute("DELETE FROM playlists WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn add_track_to_playlist(playlist_id: i64, track_id: i64) -> Result<(), String> {
    let conn = DB.conn.lock().unwrap();

    let max_position: Option<i32> = conn
        .query_row(
            "SELECT MAX(position) FROM playlist_tracks WHERE playlist_id = ?1",
            params![playlist_id],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    let position = max_position.unwrap_or(-1) + 1;
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT OR REPLACE INTO playlist_tracks (playlist_id, track_id, position, added_at) VALUES (?1, ?2, ?3, ?4)",
        params![playlist_id, track_id, position, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn remove_track_from_playlist(playlist_id: i64, track_id: i64) -> Result<(), String> {
    let conn = DB.conn.lock().unwrap();
    conn.execute(
        "DELETE FROM playlist_tracks WHERE playlist_id = ?1 AND track_id = ?2",
        params![playlist_id, track_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn reorder_playlist_track(playlist_id: i64, track_id: i64, new_position: i32) -> Result<(), String> {
    let conn = DB.conn.lock().unwrap();

    conn.execute(
        "UPDATE playlist_tracks SET position = ?3 WHERE playlist_id = ?1 AND track_id = ?2",
        params![playlist_id, track_id, new_position],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_playlist_tracks(playlist_id: i64) -> Result<Vec<Track>, String> {
    let conn = DB.conn.lock().unwrap();
    let mut stmt = conn
        .prepare(
            "SELECT t.id, t.title, t.artist, t.album, t.genre, t.year, t.duration, t.track_number,
                    t.file_path, t.file_size, t.last_modified, t.created_at, t.updated_at
             FROM playlist_tracks pt
             JOIN tracks t ON pt.track_id = t.id
             WHERE pt.playlist_id = ?1
             ORDER BY pt.position",
        )
        .map_err(|e| e.to_string())?;

    let tracks = stmt
        .query_map(params![playlist_id], |row| {
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

    Ok(tracks)
}

#[tauri::command]
pub fn get_genres() -> Result<Vec<String>, String> {
    let conn = DB.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT DISTINCT genre FROM tracks WHERE genre != '' ORDER BY genre")
        .map_err(|e| e.to_string())?;

    let genres = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(genres)
}

#[tauri::command]
pub fn get_artists() -> Result<Vec<String>, String> {
    let conn = DB.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT DISTINCT artist FROM tracks WHERE artist != '' ORDER BY artist")
        .map_err(|e| e.to_string())?;

    let artists = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(artists)
}

#[tauri::command]
pub fn get_albums() -> Result<Vec<String>, String> {
    let conn = DB.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT DISTINCT album FROM tracks WHERE album != '' ORDER BY album")
        .map_err(|e| e.to_string())?;

    let albums = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(albums)
}

#[tauri::command]
pub fn get_years() -> Result<Vec<i32>, String> {
    let conn = DB.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT DISTINCT year FROM tracks WHERE year IS NOT NULL ORDER BY year DESC")
        .map_err(|e| e.to_string())?;

    let years = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(years)
}
