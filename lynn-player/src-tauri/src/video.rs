use serde::Serialize;
use std::path::Path;

#[derive(Debug, Serialize)]
pub struct VideoMetadata {
    duration: f64,
    width: u32,
    height: u32,
    video_codec: String,
    audio_codec: String,
    frame_rate: f64,
    has_subtitles: bool,
}

fn detect_codec_by_extension(path: &Path) -> (String, String) {
    match path.extension().and_then(|e| e.to_str()) {
        Some("mp4") | Some("m4v") => ("h264".to_string(), "aac".to_string()),
        Some("webm") => ("vp9".to_string(), "opus".to_string()),
        Some("mkv") => ("h264".to_string(), "aac".to_string()),
        Some("avi") => ("mpeg4".to_string(), "mp3".to_string()),
        Some("mov") => ("h264".to_string(), "aac".to_string()),
        Some("flv") => ("h264".to_string(), "aac".to_string()),
        Some("wmv") => ("wmv".to_string(), "wma".to_string()),
        _ => ("unknown".to_string(), "unknown".to_string()),
    }
}

fn try_parse_mp4(path: &Path) -> Option<VideoMetadata> {
    let file = std::fs::File::open(path).ok()?;
    let mp4 = mp4::read_mp4(file).ok()?;

    let duration = mp4.duration().as_secs_f64();

    let mut width: u32 = 0;
    let mut height: u32 = 0;
    let mut video_codec = "unknown".to_string();
    let mut frame_rate: f64 = 0.0;
    let mut audio_codec = "unknown".to_string();
    let mut has_subtitles = false;

    for track in mp4.tracks().values() {
        if let Ok(media_type) = track.media_type() {
            let codec_name = format!("{:?}", media_type);
            match media_type {
                mp4::MediaType::H264 | mp4::MediaType::H265 | mp4::MediaType::VP9 => {
                    video_codec = codec_name;
                    width = track.width() as u32;
                    height = track.height() as u32;
                    frame_rate = 30.0;
                }
                mp4::MediaType::AAC => {
                    audio_codec = codec_name;
                }
                other => {
                    let name = format!("{:?}", other);
                    if name.contains("opus") || name.contains("Opus") || name.contains("mp3") || name.contains("MP3") {
                        audio_codec = name.clone();
                    }
                    if name.contains("subtitle") || name.contains("Subtitle") {
                        has_subtitles = true;
                    }
                }
            }
        }
    }

    Some(VideoMetadata {
        duration,
        width,
        height,
        video_codec,
        audio_codec,
        frame_rate,
        has_subtitles,
    })
}

#[tauri::command]
pub fn get_video_metadata(path: String) -> Result<VideoMetadata, String> {
    let file_path = Path::new(&path);

    if !file_path.exists() {
        return Err(format!("File not found: {}", path));
    }

    let ext = file_path.extension().and_then(|e| e.to_str()).unwrap_or("");

    if ext == "mp4" || ext == "m4v" || ext == "mov" {
        if let Some(metadata) = try_parse_mp4(file_path) {
            return Ok(metadata);
        }
    }

    let (video_codec, audio_codec) = detect_codec_by_extension(file_path);

    Ok(VideoMetadata {
        duration: 0.0,
        width: 0,
        height: 0,
        video_codec,
        audio_codec,
        frame_rate: 0.0,
        has_subtitles: false,
    })
}

#[tauri::command]
pub fn get_supported_video_formats() -> Vec<String> {
    vec![
        "mp4".to_string(),
        "avi".to_string(),
        "mkv".to_string(),
        "flv".to_string(),
        "mov".to_string(),
        "wmv".to_string(),
        "webm".to_string(),
        "m4v".to_string(),
        "3gp".to_string(),
        "ts".to_string(),
    ]
}
