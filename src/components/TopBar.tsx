import React, { useEffect, useState } from 'react';
import { useContentStore } from '../store/useContentStore';

export const TopBar: React.FC = () => {
  const {
    history,
    isHistoryOpen,
    setHistoryOpen,
    apiKey,
    hasServerKey,
    isApiConfigOpen,
    setApiConfigOpen,
    setApiKey,
    checkServerStatus,
  } = useContentStore();

  const [draftKey, setDraftKey] = useState(apiKey);

  useEffect(() => {
    checkServerStatus();
  }, [checkServerStatus]);

  useEffect(() => {
    setDraftKey(apiKey);
  }, [apiKey]);

  // Горячая клавиша ⌘H / Ctrl+H для открытия истории
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setHistoryOpen(!isHistoryOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHistoryOpen, setHistoryOpen]);

  const isLiveKeyActive = Boolean(apiKey || hasServerKey);

  return (
    <header className="top-bar">
      <div className="top-bar-inner">
        {/* Слева: Строгий логотип + статус API */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: 'var(--text-primary)',
            }}
          >
            CONTENT_ENGINE <span style={{ color: 'var(--text-muted)' }}>// v1.0</span>
          </div>

          <button
            type="button"
            onClick={() => setApiConfigOpen(!isApiConfigOpen)}
            title="Настроить GEMINI_API_KEY (клик для ввода ключа)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '3px 8px',
              backgroundColor: 'var(--bg-surface-1)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xs)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.06em',
              color: 'var(--text-secondary)',
            }}
          >
            <span
              style={{
                width: '4px',
                height: '4px',
                backgroundColor: '#22C55E',
                display: 'inline-block',
              }}
            />
            <span>GEMINI-2.5-FLASH</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
              [{isLiveKeyActive ? 'LIVE' : 'SYNTH'}]
            </span>
          </button>

          {/* Выпадающая техническая панель настройки GEMINI_API_KEY */}
          {isApiConfigOpen && (
            <div
              style={{
                position: 'absolute',
                top: '36px',
                left: '0',
                width: '340px',
                backgroundColor: 'var(--bg-surface-1)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                zIndex: 80,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div className="mono-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GEMINI_API_KEY // КОНФИГУРАЦИЯ</span>
                <button
                  type="button"
                  onClick={() => setApiConfigOpen(false)}
                  style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                >
                  [✕]
                </button>
              </div>
              <input
                type="password"
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                placeholder={hasServerKey ? 'Ключ задан на сервере (.env)' : 'AIzaSy... (опционально)'}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xs)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {hasServerKey
                  ? 'На бэкенде обнаружен GEMINI_API_KEY. Вы можете переопределить его локально.'
                  : 'Если ключ не указан, работает встроенный потоковый синтезатор реального времени.'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                {draftKey && (
                  <button
                    type="button"
                    className="btn-technical"
                    onClick={() => {
                      setDraftKey('');
                      setApiKey('');
                      setApiConfigOpen(false);
                    }}
                  >
                    [ СБРОСИТЬ ]
                  </button>
                )}
                <button
                  type="button"
                  className="btn-generate"
                  style={{ height: '28px', padding: '0 10px' }}
                  onClick={() => {
                    setApiKey(draftKey);
                    setApiConfigOpen(false);
                  }}
                >
                  [ СОХРАНИТЬ ]
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Справа: Кнопка открытия истории [ ИСТОРИЯ (14) ] с хоткеем ⌘H */}
        <button
          type="button"
          className="btn-technical"
          onClick={() => setHistoryOpen(!isHistoryOpen)}
          style={{
            borderColor: isHistoryOpen ? 'var(--accent-border)' : undefined,
            color: isHistoryOpen ? 'var(--text-primary)' : undefined,
          }}
        >
          <span>[ ИСТОРИЯ ({history.length}) ]</span>
          <span style={{ color: 'var(--text-muted)', marginLeft: '2px' }}>⌘H</span>
        </button>
      </div>
    </header>
  );
};
