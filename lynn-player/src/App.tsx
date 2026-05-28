import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './stores/appStore';
import { useVisualStore } from './stores/visualStore';
import AppLayout from './components/layout/AppLayout';
import MusicPage from './modules/local-music/MusicPage';
import VideoPage from './modules/local-video/VideoPage';
import OnlinePage from './modules/netease/OnlinePage';
import BilibiliPage from './modules/bilibili/BilibiliPage';
import SettingsPage from './components/settings/SettingsPage';

function ThemeInitializer() {
  const { theme } = useAppStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');

      const handler = (e: MediaQueryListEvent) => {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  return null;
}

function App() {
  const initializeVisualEffects = useVisualStore((s) => s.initializeVisualEffects);

  useEffect(() => {
    initializeVisualEffects();
  }, [initializeVisualEffects]);

  return (
    <BrowserRouter>
      <ThemeInitializer />
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/music" replace />} />
          <Route path="/music" element={<MusicPage />} />
          <Route path="/video" element={<VideoPage />} />
          <Route path="/online" element={<OnlinePage />} />
          <Route path="/bilibili" element={<BilibiliPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
