import React from 'react';
import { useContentStore } from '../store/useContentStore';

export const ErrorBanner: React.FC = () => {
  const { error, startGeneration, clearError } = useContentStore();

  if (!error) return null;

  return (
    <div className="error-banner" role="alert">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: '#EF4444',
          }}
        >
          [{error.code || 'ERR_STREAM_INTERRUPTED'}]
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {error.message}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          type="button"
          className="btn-technical"
          onClick={() => clearError()}
        >
          [ СКРЫТЬ ]
        </button>
        <button
          type="button"
          className="btn-technical"
          style={{
            borderColor: '#7F1D1D',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-surface-3)',
          }}
          onClick={() => startGeneration()}
        >
          [ ПОВТОРИТЬ ЗАПРОС ]
        </button>
      </div>
    </div>
  );
};
