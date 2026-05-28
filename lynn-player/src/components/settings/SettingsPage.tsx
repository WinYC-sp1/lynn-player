import { useAppStore } from '../../stores/appStore';
import VisualEffectsSettings from './VisualEffectsSettings';

const themes = [
  { value: 'light' as const, label: '浅色' },
  { value: 'dark' as const, label: '深色' },
  { value: 'system' as const, label: '跟随系统' },
];

export default function SettingsPage() {
  const { theme, setTheme } = useAppStore();

  return (
    <div>
      <h1>设置</h1>
      <div style={{ marginTop: '16px' }}>
        <h3 style={{ marginBottom: '8px' }}>主题</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                backgroundColor: theme === t.value ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: theme === t.value ? '#ffffff' : 'var(--text-primary)',
                fontSize: '13px',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '8px' }}>视觉效果</h3>
        <VisualEffectsSettings />
      </div>
    </div>
  );
}
