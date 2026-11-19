import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useContentStore } from '../store/useContentStore';
import { SocialPlatform } from '../types';
import { PLATFORM_FORMATS } from '../constants/formats';

const PLATFORMS: Array<{ id: SocialPlatform; label: string; sublabel: string }> = [
  { id: 'tiktok', label: 'TIKTOK', sublabel: 'FOR YOU' },
  { id: 'youtube', label: 'YOUTUBE', sublabel: 'SHORTS & 16:9' },
  { id: 'telegram', label: 'TELEGRAM', sublabel: 'КАНАЛ & ЧАТЫ' },
  { id: 'instagram', label: 'INSTAGRAM', sublabel: 'REELS & КАРУСЕЛЬ' },
];

export const CommandConsole: React.FC = () => {
  const {
    platform,
    selectedFormatId,
    topic,
    variantsCount,
    isPregenerating,
    pregenOpen,
    suggestedAngles,
    selectedAngles,
    detectedTone,
    formatAdvice,
    isStreaming,
    setPlatform,
    setSelectedFormatId,
    setTopic,
    setVariantsCount,
    toggleAngle,
    triggerPregenerate,
    startGeneration,
    stopGeneration,
  } = useContentStore();

  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Авто-рост высоты textarea от 96px до 240px без скроллбаров
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '96px';
    const nextHeight = Math.min(Math.max(el.scrollHeight, 96), 240);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > 240 ? 'auto' : 'hidden';
  }, [topic]);

  // Фоновая умная прегенерация при паузе ввода (950ms), если введено >= 14 символов
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (topic.trim().length >= 14 && suggestedAngles.length === 0 && !isPregenerating) {
      debounceTimerRef.current = setTimeout(() => {
        triggerPregenerate();
      }, 950);
    }
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [topic, suggestedAngles.length, isPregenerating, triggerPregenerate]);

  const charCount = topic.length;
  const approxTokens = Math.max(0, Math.ceil(charCount / 3.8));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (topic.trim() && !isStreaming) {
        startGeneration();
      }
    }
  };

  const currentPlatformFormats = PLATFORM_FORMATS[platform] || [];
  const activeFormatDef =
    currentPlatformFormats.find((f) => f.id === selectedFormatId) || currentPlatformFormats[0];

  return (
    <section
      className={`command-console ${isFocused ? 'is-focused' : ''}`}
      aria-label="Пульт управления генерацией контента"
    >
      {/* Микро-планка шасси пульта */}
      <div className="console-chassis-header">
        <span>CONSOLE // WORKSTATION</span>
        <span>
          PLATFORM: <strong style={{ color: 'var(--accent-primary)' }}>{platform.toUpperCase()}</strong> · FORMAT:{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{activeFormatDef?.name.toUpperCase()}</strong>
        </span>
      </div>

      {/* Ярус 1: Селектор платформы (4 соцсети) */}
      <div className="console-tier-1" role="tablist" aria-label="Выбор социальной сети">
        {PLATFORMS.map((item) => {
          const isActive = platform === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`platform-tab ${isActive ? 'active' : ''}`}
              onClick={() => setPlatform(item.id)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{item.sublabel}</span>
              </div>
              <span className="marker">{isActive ? '[●]' : '[ ]'}</span>
            </button>
          );
        })}
      </div>

      {/* Полка выбора форматов для текущей соцсети */}
      <div className="format-shelf">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <span className="mono-label">
            ФОРМАТЫ {platform.toUpperCase()} · ВЫБЕРИТЕ ТИП ПУБЛИКАЦИИ:
          </span>
          {activeFormatDef && (
            <span className="mono-label" style={{ color: 'var(--text-secondary)' }}>
              {activeFormatDef.description}
            </span>
          )}
        </div>

        <div className="format-chips-grid">
          {currentPlatformFormats.map((f) => {
            const isSelected = selectedFormatId === f.id;
            return (
              <button
                key={f.id}
                type="button"
                className={`format-chip-btn ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedFormatId(f.id)}
                title={`${f.viewsAdvantage}\n${f.easeAdvantage}`}
              >
                <span>{isSelected ? '[✓]' : '[ ]'}</span>
                <strong>{f.badge}</strong>
                {f.isMaxViews && (
                  <span className="format-indicator-badge max-views">⚡ МАКС. ПРОСМОТРЫ</span>
                )}
                {f.isEasiest && (
                  <span className="format-indicator-badge easiest">⏱️ ЛЕГЧЕ ВСЕГО</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Блок стратегии и советов ИИ: Что больше набирает просмотров и что легче */}
      {formatAdvice && (
        <div className="ai-advisor-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <span className="mono-label" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
              💡 СОВЕТ ИИ-АССИСТЕНТА ПО ФОРМАТАМ ДЛЯ ВАШЕЙ ИДЕИ:
            </span>
            <span className="mono-label">
              РЕКОМЕНДУЕМЫЙ ФОРМАТ: <strong>{formatAdvice.recommendedFormatName.toUpperCase()}</strong>
            </span>
          </div>

          <div className="advisor-cards-grid">
            {/* Что больше набирает просмотров */}
            <div className="advisor-card">
              <span className="mono-label" style={{ color: '#EF4444', fontWeight: 600 }}>
                ⚡ ЧТО НАБЕРЕТ БОЛЬШЕ ПРОСМОТРОВ:
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {formatAdvice.maxViewsAdvice}
              </p>
            </div>

            {/* Что из этого легче сделать */}
            <div className="advisor-card">
              <span className="mono-label" style={{ color: '#22C55E', fontWeight: 600 }}>
                ⏱️ ЧТО ИЗ ЭТОГО ЛЕГЧЕ СДЕЛАТЬ:
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {formatAdvice.easiestAdvice}
              </p>
            </div>
          </div>

          {formatAdvice.strategicTip && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--accent-primary)' }}>▸</span>
              <span><strong>Стратегический совет:</strong> {formatAdvice.strategicTip}</span>
            </div>
          )}
        </div>
      )}

      {/* Ярус 2: Поле ввода */}
      <div className="console-tier-2">
        <textarea
          ref={textareaRef}
          className="prompt-textarea"
          value={topic}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Например: хочу сделать первое видео о своих навыках в 3D (показать моделирование, процесс или готовые рендеры)... (⌘/Ctrl + Enter для запуска)"
        />
        <div className="prompt-counter-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{charCount} CHARS</span>
            <span>·</span>
            <span>~{approxTokens} TOKENS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--accent-primary)' }}>
              ФОРМАТ: {activeFormatDef?.name.toUpperCase()}
            </span>
            <span>·</span>
            <span>⌘↵ RUN</span>
          </div>
        </div>
      </div>

      {/* Линия сканирования при прегенерации */}
      {(isPregenerating || isStreaming) && (
        <div className="pregen-scan-track">
          <div className="pregen-scan-bar" />
        </div>
      )}

      {/* Ярус 3: Полоса прегенерации углов и запуска */}
      <div className="console-tier-3">
        <AnimatePresence initial={false}>
          {pregenOpen && (suggestedAngles.length > 0 || isPregenerating) && (
            <motion.div
              key="pregen-drawer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="pregen-drawer">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span className="mono-label">
                    [PRE-GEN // УГЛЫ ПОДАЧИ · КЛИК ДЛЯ ВКЛЮЧЕНИЯ В ГЕНЕРАЦИЮ]
                  </span>
                  <span className="mono-label" style={{ color: 'var(--accent-primary)' }}>
                    ТОНАЛЬНОСТЬ: {detectedTone.toUpperCase()}
                  </span>
                </div>

                {isPregenerating && suggestedAngles.length === 0 ? (
                  <div className="mono-label" style={{ padding: '4px 0' }}>
                    АНАЛИЗ КОНТЕКСТА, ОХВАТОВ И ФОРМАТОВ...
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {suggestedAngles.map((angle, idx) => {
                      const isSelected = selectedAngles.includes(angle);
                      return (
                        <motion.button
                          key={`${angle}-${idx}`}
                          type="button"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 280,
                            damping: 28,
                            delay: idx * 0.04,
                          }}
                          className={`angle-tag-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleAngle(angle)}
                        >
                          <span
                            style={{
                              color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                              fontWeight: 600,
                            }}
                          >
                            {isSelected ? '[✓]' : '[+]'}
                          </span>
                          <span>+ {angle}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Нижняя панель управления */}
        <div className="console-actions-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-technical"
              disabled={!topic.trim() || isPregenerating}
              onClick={() => triggerPregenerate()}
              title="Получить рекомендации по формату и углам подачи"
            >
              <span>[ ПОДОБРАТЬ ФОРМАТ И УГОЛ ]</span>
            </button>

            {/* Переключатель количества вариантов */}
            <div
              style={{
                display: 'inline-flex',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xs)',
                overflow: 'hidden',
              }}
            >
              {([2, 3] as const).map((count) => {
                const active = variantsCount === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setVariantsCount(count)}
                    style={{
                      height: '28px',
                      padding: '0 8px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      letterSpacing: '0.06em',
                      backgroundColor: active ? 'var(--bg-surface-3)' : 'var(--bg-surface-1)',
                      color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                      borderRight: count === 2 ? '1px solid var(--border-subtle)' : 'none',
                    }}
                  >
                    {count} ВАР.
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isStreaming ? (
              <button
                type="button"
                className="btn-technical"
                onClick={() => stopGeneration()}
                style={{ borderColor: '#7F1D1D', color: '#EF4444' }}
              >
                [ ОСТАНОВИТЬ ПОТОК ■ ]
              </button>
            ) : (
              <button
                type="button"
                className="btn-generate"
                disabled={!topic.trim()}
                onClick={() => startGeneration()}
              >
                <span>[ СГЕНЕРИРОВАТЬ {activeFormatDef?.badge} ↵ ]</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
