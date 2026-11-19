import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useContentStore } from '../store/useContentStore';
import { SocialPlatform } from '../types';

const PLATFORM_FILTERS: Array<{ id: 'all' | SocialPlatform; label: string }> = [
  { id: 'all', label: 'ALL' },
  { id: 'tiktok', label: 'TT' },
  { id: 'youtube', label: 'YT' },
  { id: 'telegram', label: 'TG' },
  { id: 'instagram', label: 'IG' },
];

function formatMonoDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} // ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export const HistoryDrawer: React.FC = () => {
  const {
    history,
    isHistoryOpen,
    historyFilterPlatform,
    historySearchQuery,
    setHistoryOpen,
    setHistoryFilterPlatform,
    setHistorySearchQuery,
    restoreFromHistory,
    deleteHistoryItem,
    clearAllHistory,
  } = useContentStore();

  const filteredHistory = history.filter((item) => {
    const matchesPlatform =
      historyFilterPlatform === 'all' || item.platform === historyFilterPlatform;
    const q = historySearchQuery.trim().toLowerCase();
    if (!q) return matchesPlatform;
    const inTopic = item.topic.toLowerCase().includes(q);
    const inVariants = item.variants.some(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.body.toLowerCase().includes(q) ||
        v.angleTitle.toLowerCase().includes(q)
    );
    return matchesPlatform && (inTopic || inVariants);
  });

  return (
    <AnimatePresence>
      {isHistoryOpen && (
        <>
          <motion.div
            key="backdrop"
            className="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setHistoryOpen(false)}
          />

          <motion.aside
            key="drawer"
            className="history-drawer"
            aria-label="История сгенерированных постов"
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          >
            {/* Шапка дровера */}
            <div
              style={{
                height: '48px',
                padding: '0 16px',
                borderBottom: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                }}
              >
                ARCHIVE // ИСТОРИЯ ({history.length})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {history.length > 0 && (
                  <button
                    type="button"
                    className="btn-technical"
                    style={{ height: '26px', padding: '0 8px', fontSize: '10px' }}
                    onClick={() => clearAllHistory()}
                  >
                    [ ОЧИСТИТЬ ]
                  </button>
                )}
                <button
                  type="button"
                  className="btn-technical"
                  style={{ height: '26px', padding: '0 8px' }}
                  onClick={() => setHistoryOpen(false)}
                >
                  [ ЗАКРЫТЬ ✕ ]
                </button>
              </div>
            </div>

            {/* Панель поиска и фильтрации (ALL / TG / YT / IG) */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                backgroundColor: 'var(--bg-canvas)',
              }}
            >
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Поиск по теме или тексту поста..."
                style={{
                  width: '100%',
                  height: '32px',
                  padding: '0 10px',
                  backgroundColor: 'var(--bg-surface-1)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xs)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                }}
              />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xs)',
                  overflow: 'hidden',
                }}
              >
                {PLATFORM_FILTERS.map((f, idx) => {
                  const active = historyFilterPlatform === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setHistoryFilterPlatform(f.id)}
                      style={{
                        height: '28px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        fontWeight: active ? 600 : 400,
                        letterSpacing: '0.06em',
                        backgroundColor: active
                          ? 'var(--bg-surface-3)'
                          : 'var(--bg-surface-1)',
                        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                        borderRight:
                          idx < PLATFORM_FILTERS.length - 1
                            ? '1px solid var(--border-subtle)'
                            : 'none',
                      }}
                    >
                      {active ? `[${f.label}]` : f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Плотный список прошлых генераций */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {filteredHistory.length === 0 ? (
                <div
                  style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                  }}
                >
                  [ ЗАПИСЕЙ НЕ НАЙДЕНО ]
                </div>
              ) : (
                filteredHistory.map((record) => (
                  <div
                    key={record.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      backgroundColor: 'var(--bg-surface-1)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {formatMonoDate(record.createdAt)}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          padding: '2px 6px',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-xs)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {record.platform.toUpperCase()} · {record.variants.length} ВАР.
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {record.topic}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginTop: '2px',
                      }}
                    >
                      <button
                        type="button"
                        className="btn-technical"
                        style={{
                          height: '26px',
                          padding: '0 10px',
                          fontSize: '10px',
                          color: 'var(--text-primary)',
                          borderColor: 'var(--border-strong)',
                        }}
                        onClick={() => restoreFromHistory(record)}
                      >
                        [ ВОССТАНОВИТЬ НА ЭКРАН ↵ ]
                      </button>

                      <button
                        type="button"
                        className="btn-technical"
                        style={{
                          height: '26px',
                          padding: '0 8px',
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                        }}
                        onClick={() => deleteHistoryItem(record.id)}
                      >
                        [ УДАЛИТЬ ]
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
