use anyhow::Result;
use crossbeam_channel::{unbounded, Receiver, Sender};
use lru::LruCache;
use lofty::file::AudioFile;
use serde::{Deserialize, Serialize};
use std::num::NonZeroUsize;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::thread;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioData {
    pub samples: Vec<f32>,
    pub sample_rate: u32,
    pub channels: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WorkerCommand {
    DecodeAudio(PathBuf),
    CacheCleanup,
    Shutdown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WorkerEvent {
    DecodeComplete(Result<AudioData, String>),
    StatusUpdate(String),
}

struct AudioDecoderWorker {
    command_rx: Receiver<WorkerCommand>,
    event_tx: Sender<WorkerEvent>,
    cache: Arc<Mutex<LruCache<PathBuf, AudioData>>>,
}

impl AudioDecoderWorker {
    fn new(
        command_rx: Receiver<WorkerCommand>,
        event_tx: Sender<WorkerEvent>,
        cache: Arc<Mutex<LruCache<PathBuf, AudioData>>>,
    ) -> Self {
        AudioDecoderWorker {
            command_rx,
            event_tx,
            cache,
        }
    }

    fn run(&self) {
        while let Ok(command) = self.command_rx.recv() {
            match command {
                WorkerCommand::DecodeAudio(path) => {
                    let result = self.decode_audio(&path);
                    let _ = self.event_tx.send(WorkerEvent::DecodeComplete(result));
                }
                WorkerCommand::CacheCleanup => {
                    let mut cache = self.cache.lock().unwrap();
                    let old_size = cache.len();
                    cache.clear();
                    let _ = self.event_tx.send(WorkerEvent::StatusUpdate(format!(
                        "Cache cleared: {} items removed",
                        old_size
                    )));
                }
                WorkerCommand::Shutdown => {
                    break;
                }
            }
        }
    }

    fn decode_audio(&self, path: &PathBuf) -> Result<AudioData, String> {
        {
            let mut cache = self.cache.lock().unwrap();
            if let Some(data) = cache.get(path) {
                return Ok(data.clone());
            }
        }

        let data = self.perform_decode(path)?;

        {
            let mut cache = self.cache.lock().unwrap();
            cache.put(path.clone(), data.clone());
        }

        Ok(data)
    }

    fn perform_decode(&self, path: &PathBuf) -> Result<AudioData, String> {
        let tagged_file = lofty::read_from_path(path).map_err(|e| e.to_string())?;
        let properties = tagged_file.properties();

        let sample_rate = properties.sample_rate().unwrap_or(44100);
        let channels = properties.channels().unwrap_or(2) as u16;

        let duration = properties.duration().as_secs_f64();
        let total_samples = (duration * sample_rate as f64) as usize;
        let samples = vec![0.0f32; total_samples * channels as usize];

        Ok(AudioData {
            samples,
            sample_rate,
            channels,
        })
    }
}

pub struct WorkerPool {
    command_tx: Sender<WorkerCommand>,
    event_rx: Receiver<WorkerEvent>,
    workers: Vec<thread::JoinHandle<()>>,
    cache: Arc<Mutex<LruCache<PathBuf, AudioData>>>,
}

impl WorkerPool {
    pub fn new(num_workers: usize, cache_size: usize) -> Self {
        let (command_tx, command_rx) = unbounded();
        let (event_tx, event_rx) = unbounded();
        let cache = Arc::new(Mutex::new(LruCache::new(
            NonZeroUsize::new(cache_size).unwrap_or(NonZeroUsize::new(10).unwrap()),
        )));

        let mut workers = Vec::new();

        for _ in 0..num_workers {
            let rx = command_rx.clone();
            let tx = event_tx.clone();
            let cache = cache.clone();

            let handle = thread::spawn(move || {
                let worker = AudioDecoderWorker::new(rx, tx, cache);
                worker.run();
            });

            workers.push(handle);
        }

        WorkerPool {
            command_tx,
            event_rx,
            workers,
            cache,
        }
    }

    pub fn send_command(&self, command: WorkerCommand) -> Result<(), String> {
        self.command_tx.send(command).map_err(|e| e.to_string())
    }

    pub fn receive_event(&self) -> Result<WorkerEvent, String> {
        self.event_rx.recv().map_err(|e| e.to_string())
    }

    pub fn try_receive_event(&self) -> Option<WorkerEvent> {
        self.event_rx.try_recv().ok()
    }
}

static WORKER_POOL: once_cell::sync::Lazy<Mutex<Option<WorkerPool>>> =
    once_cell::sync::Lazy::new(|| Mutex::new(None));

#[tauri::command]
pub fn init_worker_pool(num_workers: Option<usize>, cache_size: Option<usize>) -> Result<(), String> {
    let mut pool = WORKER_POOL.lock().unwrap();
    if pool.is_some() {
        return Err("Worker pool already initialized".to_string());
    }

    let workers = num_workers.unwrap_or(4);
    let cache = cache_size.unwrap_or(50);
    *pool = Some(WorkerPool::new(workers, cache));
    Ok(())
}

#[tauri::command]
pub fn decode_audio_async(path: String) -> Result<(), String> {
    let pool_guard = WORKER_POOL.lock().unwrap();
    let pool = pool_guard.as_ref().ok_or("Worker pool not initialized")?;
    pool.send_command(WorkerCommand::DecodeAudio(PathBuf::from(path)))
}

#[tauri::command]
pub fn get_decoder_event() -> Result<Option<WorkerEvent>, String> {
    let pool_guard = WORKER_POOL.lock().unwrap();
    let pool = pool_guard.as_ref().ok_or("Worker pool not initialized")?;
    Ok(pool.try_receive_event())
}

#[tauri::command]
pub fn clear_audio_cache() -> Result<(), String> {
    let pool_guard = WORKER_POOL.lock().unwrap();
    let pool = pool_guard.as_ref().ok_or("Worker pool not initialized")?;
    pool.send_command(WorkerCommand::CacheCleanup)
}

#[tauri::command]
pub fn shutdown_workers() -> Result<(), String> {
    let mut pool_guard = WORKER_POOL.lock().unwrap();
    if let Some(pool) = pool_guard.take() {
        for _ in 0..pool.workers.len() {
            let _ = pool.send_command(WorkerCommand::Shutdown);
        }
        for worker in pool.workers {
            let _ = worker.join();
        }
    }
    Ok(())
}
