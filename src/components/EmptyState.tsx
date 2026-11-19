import React from 'react';
import { PRESET_EXAMPLES, useContentStore } from '../store/useContentStore';

export const EmptyState: React.FC = () => {
  const { loadPreset, startGeneration } = useContentStore();

  return (
    <section
      aria-label="Пресеты быстрого старта"
      style={{
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--bg-canvas)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span className="mono-label">
          READY // ВЫБЕРИТЕ ТЕХНИЧЕСКИЙ ПРЕСЕТ ИЛИ ВВЕДИТЕ СВОЮ ТЕМУ ВЫШЕ
        </span>
        <span className="mono-label">ZERO-SLOP ENGINE</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {PRESET_EXAMPLES.map((preset, index) => (
          <div
            key={preset.id}
            style={{
              padding: '14px',
              borderBottom:
                index < PRESET_EXAMPLES.length - 1
                  ? '1px solid var(--border-subtle)'
                  : 'none',
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
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => loadPreset(preset)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                }}
              >
                <span style={{ color: 'var(--accent-primary)' }}>
                  [ {preset.code}: {preset.label} ]
                </span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  className="mono-label"
                  style={{
                    padding: '2px 6px',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-xs)',
                  }}
                >
                  {preset.platform.toUpperCase()}
                  {preset.formatId ? ` · ${preset.formatId.toUpperCase()}` : ''}
                </span>
                <button
                  type="button"
                  className="btn-technical"
                  style={{ height: '24px', padding: '0 8px', fontSize: '10px' }}
                  onClick={() => {
                    loadPreset(preset);
                  }}
                >
                  [ ЗАГРУЗИТЬ ]
                </button>
                <button
                  type="button"
                  className="btn-technical"
                  style={{
                    height: '24px',
                    padding: '0 8px',
                    fontSize: '10px',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-strong)',
                  }}
                  onClick={() => {
                    loadPreset(preset);
                    setTimeout(() => startGeneration(), 30);
                  }}
                >
                  [ ЗАПУСТИТЬ ↵ ]
                </button>
              </div>
            </div>

            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: 1.45,
              }}
            >
              {preset.topic}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
