import { invoke } from '@tauri-apps/api/core';

export async function detectWindowsVersion(): Promise<string> {
  try {
    return await invoke<string>('detect_windows_version');
  } catch {
    return 'unknown';
  }
}

export async function applyMicaEffect(): Promise<void> {
  try {
    await invoke('apply_mica_effect');
  } catch {
    console.warn('failed to apply mica effect');
  }
}

export async function applyAcrylicEffect(): Promise<void> {
  try {
    await invoke('apply_acrylic_effect');
  } catch {
    console.warn('failed to apply acrylic effect');
  }
}

export async function removeVisualEffect(): Promise<void> {
  try {
    await invoke('remove_visual_effect');
  } catch {
    console.warn('failed to remove visual effect');
  }
}

export async function setEffectOpacity(opacity: number): Promise<void> {
  try {
    await invoke('set_effect_opacity', { opacity });
  } catch {
    console.warn('failed to set effect opacity');
  }
}
