import { useState } from 'react';
import NeteaseSearch from './NeteaseSearch';
import NeteasePlaylist from './NeteasePlaylist';
import NeteaseLogin from './NeteaseLogin';

const sources = [
  { key: 'netease', label: '网易云音乐' },
  { key: 'kugou', label: '酷狗音乐' },
];

const neteaseTabs = [
  { key: 'search', label: '搜索' },
  { key: 'playlist', label: '歌单' },
];

export default function OnlinePage() {
  const [activeSource, setActiveSource] = useState('netease');
  const [activeTab, setActiveTab] = useState('search');
  const [showLoginPanel, setShowLoginPanel] = useState(false);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600 }}>在线音乐</h1>
        {activeSource === 'netease' && (
          <button
            onClick={() => setShowLoginPanel(!showLoginPanel)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: showLoginPanel ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: showLoginPanel ? '#ffffff' : 'var(--text-primary)',
              fontSize: '13px',
            }}
          >
            {showLoginPanel ? '关闭' : '登录'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {sources.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSource(s.key)}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              backgroundColor: activeSource === s.key ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: activeSource === s.key ? '#ffffff' : 'var(--text-primary)',
              fontSize: '13px',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSource === 'netease' && (
        <div style={{ flex: 1, display: 'flex', gap: '16px', minHeight: 0 }}>
          <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
              {neteaseTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    backgroundColor: activeTab === tab.key ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: activeTab === tab.key ? '#ffffff' : 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'search' && <NeteaseSearch />}
            {activeTab === 'playlist' && <NeteasePlaylist />}
          </div>

          {showLoginPanel && (
            <div
              style={{
                width: '280px',
                flexShrink: 0,
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-secondary)',
                overflowY: 'auto',
              }}
            >
              <NeteaseLogin />
            </div>
          )}
        </div>
      )}

      {activeSource === 'kugou' && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          酷狗音乐功能开发中...
        </div>
      )}
    </div>
  );
}
