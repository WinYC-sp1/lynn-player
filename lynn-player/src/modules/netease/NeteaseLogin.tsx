import { useState, useEffect, useRef } from 'react';
import { useNeteaseStore } from '../../stores/neteaseStore';
import { neteaseClient } from '../../services/neteaseClient';
import type { NeteaseQrCreateResult } from '../../types/netease';

export default function NeteaseLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState<'phone' | 'qr'>('phone');
  const [error, setError] = useState('');
  const [qrData, setQrData] = useState<NeteaseQrCreateResult | null>(null);
  const [qrStatus, setQrStatus] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isLoggedIn, user, login, logout } = useNeteaseStore();

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  const handlePhoneLogin = async () => {
    setError('');
    try {
      await login(phone, password);
      setPhone('');
      setPassword('');
    } catch {
      setError('登录失败，请检查手机号和密码');
    }
  };

  const handleQrLogin = async () => {
    setError('');
    setQrStatus('获取二维码...');
    try {
      const result = await neteaseClient.loginQrKey();
      const qr = await neteaseClient.loginQrCreate(result.unikey, true);
      setQrData(qr);
      setQrStatus('请使用网易云音乐APP扫描二维码');

      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }

      pollRef.current = setInterval(async () => {
        try {
          const checkResult = await neteaseClient.loginQrCheck(result.unikey);
          if (checkResult.code === 800) {
            setQrStatus('二维码已过期，请重新获取');
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          } else if (checkResult.code === 802) {
            setQrStatus('扫描成功，请在手机上确认');
          } else if (checkResult.code === 803) {
            setQrStatus('登录成功');
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            const userDetail = await neteaseClient.getUserDetail(0);
            useNeteaseStore.setState({
              isLoggedIn: true,
              user: userDetail.profile,
            });
            useNeteaseStore.getState().fetchUserPlaylists();
            useNeteaseStore.getState().fetchLikelist();
          }
        } catch {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      }, 2000);
    } catch {
      setError('获取二维码失败');
      setQrStatus('');
    }
  };

  const handleLogout = async () => {
    await logout();
    setQrData(null);
    setQrStatus('');
    setError('');
  };

  if (isLoggedIn && user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={user.avatarUrl}
            alt={user.nickname}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>{user.nickname}</div>
            {user.signature && (
              <div className="ellipsis" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {user.signature}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '6px 16px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            alignSelf: 'flex-start',
          }}
        >
          退出登录
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        <button
          onClick={() => setLoginMode('phone')}
          style={{
            padding: '4px 12px',
            borderRadius: '6px',
            backgroundColor: loginMode === 'phone' ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: loginMode === 'phone' ? '#ffffff' : 'var(--text-primary)',
            fontSize: '13px',
          }}
        >
          手机登录
        </button>
        <button
          onClick={() => setLoginMode('qr')}
          style={{
            padding: '4px 12px',
            borderRadius: '6px',
            backgroundColor: loginMode === 'qr' ? 'var(--accent)' : 'var(--bg-tertiary)',
            color: loginMode === 'qr' ? '#ffffff' : 'var(--text-primary)',
            fontSize: '13px',
          }}
        >
          扫码登录
        </button>
      </div>

      {loginMode === 'phone' && (
        <>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="手机号"
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePhoneLogin();
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
            }}
          />
          <button
            onClick={handlePhoneLogin}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              fontSize: '14px',
            }}
          >
            登录
          </button>
        </>
      )}

      {loginMode === 'qr' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {qrData ? (
            <>
              {qrData.qrimg && (
                <img
                  src={qrData.qrimg}
                  alt="QR Code"
                  style={{ width: '180px', height: '180px', borderRadius: '8px' }}
                />
              )}
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{qrStatus}</div>
            </>
          ) : (
            <button
              onClick={handleQrLogin}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
                fontSize: '14px',
              }}
            >
              获取二维码
            </button>
          )}
        </div>
      )}

      {error && (
        <div style={{ fontSize: '13px', color: '#e74c3c' }}>{error}</div>
      )}
    </div>
  );
}
