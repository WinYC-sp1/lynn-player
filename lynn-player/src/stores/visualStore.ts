import { create } from 'zustand';
import {
  detectWindowsVersion,
  applyMicaEffect,
  applyAcrylicEffect,
  removeVisualEffect,
  setEffectOpacity as setEffectOpacityService,
} from '../services/visualEffects';

type VisualEffect = 'mica' | 'acrylic' | 'standard';
type WindowsVersion = 'win11' | 'win10' | 'win8' | 'win7' | 'unknown';

interface VisualState {
  windowsVersion: WindowsVersion;
  currentEffect: VisualEffect;
  effectOpacity: number;
  accentColor: string;
  setWindowsVersion: (version: WindowsVersion) => void;
  setCurrentEffect: (effect: VisualEffect) => void;
  setEffectOpacity: (opacity: number) => void;
  setAccentColor: (color: string) => void;
  initializeVisualEffects: () => Promise<void>;
  applyEffect: (effect: VisualEffect) => Promise<void>;
}

export const useVisualStore = create<VisualState>((set, get) => ({
  windowsVersion: 'unknown',
  currentEffect: 'standard',
  effectOpacity: 80,
  accentColor: '#0078d4',
  setWindowsVersion: (version) => set({ windowsVersion: version }),
  setCurrentEffect: (effect) => set({ currentEffect: effect }),
  setEffectOpacity: (opacity) => {
    set({ effectOpacity: opacity });
    setEffectOpacityService(opacity / 100);
  },
  setAccentColor: (color) => set({ accentColor: color }),
  initializeVisualEffects: async () => {
    const version = await detectWindowsVersion() as WindowsVersion;
    set({ windowsVersion: version });

    let defaultEffect: VisualEffect = 'standard';
    if (version === 'win11') {
      defaultEffect = 'mica';
    } else if (version === 'win10') {
      defaultEffect = 'acrylic';
    }

    await get().applyEffect(defaultEffect);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      get().applyEffect(get().currentEffect);
    };
    mediaQuery.addEventListener('change', handler);
  },
  applyEffect: async (effect: VisualEffect) => {
    switch (effect) {
      case 'mica':
        await applyMicaEffect();
        break;
      case 'acrylic':
        await applyAcrylicEffect();
        break;
      case 'standard':
        await removeVisualEffect();
        break;
    }
    set({ currentEffect: effect });

    const root = document.documentElement;
    if (effect === 'standard') {
      root.classList.remove('with-visual-effect');
    } else {
      root.classList.add('with-visual-effect');
    }
  },
}));
