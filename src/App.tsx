import React from 'react';
import { useContentStore } from './store/useContentStore';
import { TopBar } from './components/TopBar';
import { CommandConsole } from './components/CommandConsole';
import { PostPreviewCard } from './components/PostPreviewCard';
import { EmptyState } from './components/EmptyState';
import { ErrorBanner } from './components/ErrorBanner';
import { HistoryDrawer } from './components/HistoryDrawer';

export const App: React.FC = () => {
  const {
    platform,
    variants,
    activeVariantTab,
    viewMode,
    isStreaming,
    setActiveVariantTab,
    setViewMode,
  } = useContentStore();

  const hasResults = variants.length > 0;
  const safeActiveIndex = Math.min(activeVariantTab, Math.max(0, variants.length - 1));

  return (
    <div className="app-shell" data-platform={platform}>
      {/* Сквозные вертикальные направляющие линии 1px solid var(--border-subtle) по краям 720px */}
      <div className="blueprint-rails" aria-hidden="true" />

      {/* Верхняя техническая панель (Top Bar — 48px) */}
      <TopBar />

      {/* Центральная рабочая зона (Focused Single-Column Layout — max 720px) */}
      <main className="workspace-column">
        {/* Пульт ввода (Command Console — 3 яруса) */}
        <CommandConsole />

        {/* Строгая плашка ошибки (#7F1D1D), если поток был прерван */}
        <ErrorBanner />

        {/* Секция результатов либо Empty State с 3 техническими пресетами */}
        {!hasResults ? (
          <EmptyState />
        ) : (
          <section
            aria-label="Результаты генерации"
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {/* Панель управления видом результатов: Горизонтальные вкладки вариантов + Переключатель [ ТАБЫ | ЛЕНТА ] */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
                borderBottom: '1px solid var(--border-default)',
                paddingBottom: '10px',
              }}
            >
              {/* Вкладки вариантов (активны в режиме ТАБЫ или служат быстрым индикатором в режиме ЛЕНТА) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {variants.map((v, idx) => {
                  const isActive = viewMode === 'tabs' && safeActiveIndex === idx;
                  const num = String(idx + 1).padStart(2, '0');
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setViewMode('tabs');
                        setActiveVariantTab(idx);
                      }}
                      style={{
                        height: '30px',
                        padding: '0 10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        fontWeight: isActive ? 600 : 400,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        backgroundColor: isActive
                          ? 'var(--accent-muted)'
                          : 'var(--bg-surface-2)',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        border: `1px solid ${
                          isActive ? 'var(--accent-border)' : 'var(--border-default)'
                        }`,
                        borderRadius: 'var(--radius-xs)',
                      }}
                    >
                      <span
                        style={{
                          color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                        }}
                      >
                        {isActive ? '[●]' : `[${num}]`}
                      </span>
                      <span>ВАРИАНТ {num}</span>
                    </button>
                  );
                })}

                {isStreaming && (
                  <span
                    className="mono-label"
                    style={{
                      color: 'var(--accent-primary)',
                      marginLeft: '6px',
                    }}
                  >
                    ● STREAMING SSE...
                  </span>
                )}
              </div>

              {/* Переключатель вида [ ТАБЫ | ЛЕНТА ] в правом верхнем углу секции результатов */}
              <div
                style={{
                  display: 'inline-flex',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xs)',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode('tabs')}
                  style={{
                    height: '28px',
                    padding: '0 10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.06em',
                    backgroundColor:
                      viewMode === 'tabs' ? 'var(--bg-surface-3)' : 'var(--bg-surface-1)',
                    color:
                      viewMode === 'tabs' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    borderRight: '1px solid var(--border-subtle)',
                  }}
                >
                  [ ТАБЫ ]
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('feed')}
                  style={{
                    height: '28px',
                    padding: '0 10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.06em',
                    backgroundColor:
                      viewMode === 'feed' ? 'var(--bg-surface-3)' : 'var(--bg-surface-1)',
                    color:
                      viewMode === 'feed' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  [ ЛЕНТА ]
                </button>
              </div>
            </div>

            {/* Отображение карточек «Превью реального поста» */}
            {viewMode === 'tabs' ? (
              variants[safeActiveIndex] && (
                <PostPreviewCard
                  key={variants[safeActiveIndex].id}
                  variant={variants[safeActiveIndex]}
                  variantIndex={safeActiveIndex}
                  platform={platform}
                  isStreaming={isStreaming}
                />
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {variants.map((variant, idx) => (
                  <PostPreviewCard
                    key={variant.id}
                    variant={variant}
                    variantIndex={idx}
                    platform={platform}
                    isStreaming={isStreaming}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Боковой дровер истории (Slide-over History Drawer — 400px справа) */}
      <HistoryDrawer />
    </div>
  );
};
export default App;
