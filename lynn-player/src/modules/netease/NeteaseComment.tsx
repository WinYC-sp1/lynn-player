import { useState, useEffect } from 'react';
import { neteaseClient } from '../../services/neteaseClient';
import type { NeteaseComment } from '../../types/netease';

interface NeteaseCommentProps {
  songId: number;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 30) return `${diffDays}天前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function NeteaseComment({ songId }: NeteaseCommentProps) {
  const [comments, setComments] = useState<NeteaseComment[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const limit = 20;

  useEffect(() => {
    if (songId) {
      loadComments(0);
    }
  }, [songId]);

  const loadComments = async (newOffset: number) => {
    setLoading(true);
    try {
      const result = await neteaseClient.getCommentMusic(songId, limit, newOffset);
      setComments(result.comments ?? []);
      setTotal(result.total ?? 0);
      setOffset(newOffset);
    } catch {
      setComments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!msg.trim()) return;
    try {
      await neteaseClient.commentMusic(songId, msg.trim());
      setMsg('');
      loadComments(0);
    } catch {
      // ignored
    }
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '15px', fontWeight: 600 }}>
        评论 <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '13px' }}>({total})</span>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="写下你的评论..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') handlePostComment();
          }}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontSize: '13px',
          }}
        />
        <button
          onClick={handlePostComment}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: 'var(--accent)',
            color: '#ffffff',
            fontSize: '13px',
          }}
        >
          发送
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
          加载中...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {comments.map((comment) => (
            <div
              key={comment.commentId}
              style={{
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', gap: '10px' }}>
                <img
                  src={comment.user.avatarUrl}
                  alt={comment.user.nickname}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--accent)' }}>{comment.user.nickname}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{formatTime(comment.time)}</span>
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '6px' }}>
                    {comment.content}
                  </div>
                  {comment.beReplied && comment.beReplied.length > 0 && (
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-tertiary)',
                        marginBottom: '6px',
                      }}
                    >
                      {comment.beReplied.map((reply) => (
                        <div key={reply.commentId} style={{ fontSize: '13px' }}>
                          <span style={{ color: 'var(--accent)' }}>{reply.user.nickname}</span>
                          ：{reply.content}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    👍 {comment.likedCount}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '8px 0' }}>
              <button
                onClick={() => loadComments(Math.max(0, offset - limit))}
                disabled={offset === 0}
                style={{
                  padding: '4px 12px',
                  borderRadius: '4px',
                  backgroundColor: offset === 0 ? 'var(--bg-tertiary)' : 'var(--accent)',
                  color: offset === 0 ? 'var(--text-secondary)' : '#ffffff',
                  fontSize: '12px',
                  opacity: offset === 0 ? 0.5 : 1,
                }}
              >
                上一页
              </button>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '24px' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => loadComments(offset + limit)}
                disabled={currentPage >= totalPages}
                style={{
                  padding: '4px 12px',
                  borderRadius: '4px',
                  backgroundColor: currentPage >= totalPages ? 'var(--bg-tertiary)' : 'var(--accent)',
                  color: currentPage >= totalPages ? 'var(--text-secondary)' : '#ffffff',
                  fontSize: '12px',
                  opacity: currentPage >= totalPages ? 0.5 : 1,
                }}
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
