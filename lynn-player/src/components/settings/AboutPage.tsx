import { APP_VERSION, BUILD_NUMBER, getFullVersion } from '../../utils/version';

export default function AboutPage() {
  return (
    <div>
      <h1>关于 Lynn Player</h1>
      <div style={{ marginTop: '24px', lineHeight: '2' }}>
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Lynn Player</p>
          <p style={{ color: 'var(--text-secondary)' }}>
            一款支持本地音乐、本地视频和在线音乐播放的全能媒体播放器
          </p>
        </div>
        <div style={{ marginTop: '32px', padding: '20px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '12px' }}>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>版本：</span>
            <span style={{ fontWeight: '600' }}>{APP_VERSION}</span>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>构建号：</span>
            <span style={{ fontWeight: '600' }}>{BUILD_NUMBER}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>完整版本：</span>
            <span style={{ fontWeight: '600' }}>{getFullVersion()}</span>
          </div>
        </div>
        <div style={{ marginTop: '32px', color: 'var(--text-secondary)', fontSize: '13px' }}>
          <p>© 2024 Lynn Player Team. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
