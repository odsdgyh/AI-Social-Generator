import React from 'react';
import { motion } from 'framer-motion';
import { PostVariant, SocialPlatform } from '../types';
import { useContentStore } from '../store/useContentStore';
import { StreamingText } from './StreamingText';

interface PostPreviewCardProps {
  variant: PostVariant;
  variantIndex: number;
  platform: SocialPlatform;
  isStreaming: boolean;
}

export const PostPreviewCard: React.FC<PostPreviewCardProps> = ({
  variant,
  variantIndex,
  platform,
  isStreaming,
}) => {
  const { copiedId, flashedId, copyToClipboard } = useContentStore();

  const cardTargetId = `card-${variant.id}`;
  const titleTargetId = `title-${variant.id}`;
  const bodyTargetId = `body-${variant.id}`;
  const ctaTargetId = `cta-${variant.id}`;
  const tagsTargetId = `tags-${variant.id}`;

  const isCardFlashed = flashedId === cardTargetId;
  const isCardCopied = copiedId === cardTargetId;

  const assembleFullPost = () => {
    const parts = [
      variant.title.trim(),
      variant.body.trim(),
      variant.cta.trim(),
      variant.hashtags.join(' ').trim(),
    ].filter(Boolean);
    return parts.join('\n\n');
  };

  const variantNumber = String(variantIndex + 1).padStart(2, '0');

  return (
    <motion.article
      layout="position"
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className={`post-preview-card ${isCardFlashed ? 'flash-copied' : ''}`}
    >
      {/* Шапка карточки (Header) */}
      <div className="post-card-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
              }}
            >
              ВАРИАНТ {variantNumber} // {variant.angleTitle || 'СТРУКТУРНЫЙ ДРАФТ'}
            </span>
            {variant.formatName && (
              <span
                className="mono-label"
                style={{
                  padding: '2px 6px',
                  backgroundColor: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-primary)',
                }}
              >
                {variant.formatName.toUpperCase()}
              </span>
            )}
          </div>

          {/* Мимикрия под шапку соцсети */}
          {platform === 'tiktok' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                @creator.3d
              </span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span>TIKTOK FOR YOU</span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span style={{ color: 'var(--text-muted)' }}>🎵 ОРИГИНАЛЬНЫЙ ЗВУК · 9:16</span>
            </div>
          )}

          {platform === 'telegram' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                t.me/content_engine
              </span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span>CHANNEL POST</span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span style={{ color: 'var(--text-muted)' }}>👁 2.4K · 14:32</span>
            </div>
          )}

          {platform === 'youtube' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                STUDIO // VIDEO METADATA
              </span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span>SHORTS & 16:9 4K</span>
            </div>
          )}

          {platform === 'instagram' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                @content.engine
              </span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span>REELS / CAROUSEL</span>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span style={{ color: 'var(--text-muted)' }}>ORIGINAL AUDIO</span>
            </div>
          )}
        </div>

        {/* Справа: Главная кнопка [ СКОПИРОВАТЬ ВСЁ ] с морфингом */}
        <motion.button
          layout
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          type="button"
          className="btn-technical"
          onClick={() => copyToClipboard(assembleFullPost(), cardTargetId)}
          style={{
            flexShrink: 0,
            borderColor: isCardCopied ? 'var(--accent-primary)' : undefined,
            color: isCardCopied ? 'var(--accent-primary)' : 'var(--text-primary)',
            backgroundColor: isCardCopied ? 'var(--accent-muted)' : 'var(--bg-surface-2)',
          }}
        >
          <motion.span layout="position">
            {isCardCopied ? '[ СКОПИРОВАНО ✓ ]' : '[ СКОПИРОВАТЬ ВСЁ ]'}
          </motion.span>
        </motion.button>
      </div>

      {/* Превью-рамка для TikTok */}
      {platform === 'tiktok' && (
        <div
          style={{
            margin: '12px 14px 4px',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'var(--bg-canvas)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--accent-muted)',
                border: '1px solid var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--accent-primary)',
              }}
            >
              9:16
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {variant.title || 'Хук на экране в первые 3 секунды...'}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                TIKTOK АЛГОРИТМ: ВЫСОКОЕ УДЕРЖАНИЕ С ПЕРВОГО КАДРА
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>❤️ 24.8K</span>
            <span>💬 412</span>
            <span>🔖 1.9K</span>
          </div>
        </div>
      )}

      {/* Специфичная техническая превью-рамка 16:9 для YouTube */}
      {platform === 'youtube' && (
        <div
          style={{
            margin: '12px 14px 4px',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'var(--bg-canvas)',
            aspectRatio: '16 / 5.2',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '10px 12px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--text-muted)',
            }}
          >
            <span>[FRAME // THUMBNAIL & CTR PREVIEW]</span>
            <span style={{ color: 'var(--accent-primary)' }}>● HD // 4K 60FPS</span>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {variant.title || 'Ожидание заголовка или хука...'}
          </div>

          <div
            style={{
              height: '2px',
              width: '100%',
              backgroundColor: 'var(--border-default)',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '42%',
                height: '100%',
                backgroundColor: 'var(--accent-primary)',
              }}
            />
          </div>
        </div>
      )}

      {/* Внутренняя структура поста (4 интерактивных блока: TITLE, BODY, CTA, TAGS) */}
      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* 1. Блок ЗАГОЛОВОК [TITLE] */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => variant.title && copyToClipboard(variant.title.trim(), titleTargetId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && variant.title) {
              copyToClipboard(variant.title.trim(), titleTargetId);
            }
          }}
          className={`post-zone ${flashedId === titleTargetId ? 'flash-copied' : ''}`}
        >
          <span
            className="post-zone-badge"
            style={{
              color: copiedId === titleTargetId ? 'var(--accent-primary)' : undefined,
              borderColor: copiedId === titleTargetId ? 'var(--accent-primary)' : undefined,
              opacity: copiedId === titleTargetId ? 1 : undefined,
            }}
          >
            {copiedId === titleTargetId ? '[ TITLE · СКОПИРОВАНО ✓ ]' : '[ TITLE · КОПИРОВАТЬ ]'}
          </span>

          <div className="mono-label" style={{ marginBottom: '6px' }}>
            [TITLE // ХУК И ЗАГОЛОВОК]
          </div>
          <h3 className="post-title-text">
            <StreamingText
              text={variant.title}
              isStreaming={isStreaming}
              placeholder="Хук первой строки или текст на экране..."
            />
          </h3>
        </div>

        {/* 2. Блок ОСНОВНОЙ ТЕКСТ / СЦЕНАРИЙ [BODY] */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => variant.body && copyToClipboard(variant.body.trim(), bodyTargetId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && variant.body) {
              copyToClipboard(variant.body.trim(), bodyTargetId);
            }
          }}
          className={`post-zone ${flashedId === bodyTargetId ? 'flash-copied' : ''}`}
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <span
            className="post-zone-badge"
            style={{
              color: copiedId === bodyTargetId ? 'var(--accent-primary)' : undefined,
              borderColor: copiedId === bodyTargetId ? 'var(--accent-primary)' : undefined,
              opacity: copiedId === bodyTargetId ? 1 : undefined,
            }}
          >
            {copiedId === bodyTargetId ? '[ BODY · СКОПИРОВАНО ✓ ]' : '[ BODY · КОПИРОВАТЬ ]'}
          </span>

          <div className="mono-label" style={{ marginBottom: '6px' }}>
            [BODY // СЦЕНАРИЙ, СЛАЙДЫ ИЛИ ТЕКСТ]
          </div>
          <div className="post-body-text">
            <StreamingText
              text={variant.body}
              isStreaming={isStreaming}
              placeholder="Поминутный сценарий, раскадровка или основной текст..."
            />
          </div>
        </div>

        {/* 3. Блок ПРИЗЫВ К ДЕЙСТВИЮ [CTA] */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => variant.cta && copyToClipboard(variant.cta.trim(), ctaTargetId)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && variant.cta) {
              copyToClipboard(variant.cta.trim(), ctaTargetId);
            }
          }}
          className={`post-zone ${flashedId === ctaTargetId ? 'flash-copied' : ''}`}
          style={{ borderTop: '1px dashed var(--border-subtle)' }}
        >
          <span
            className="post-zone-badge"
            style={{
              color: copiedId === ctaTargetId ? 'var(--accent-primary)' : undefined,
              borderColor: copiedId === ctaTargetId ? 'var(--accent-primary)' : undefined,
              opacity: copiedId === ctaTargetId ? 1 : undefined,
            }}
          >
            {copiedId === ctaTargetId ? '[ CTA · СКОПИРОВАНО ✓ ]' : '[ CTA · КОПИРОВАТЬ ]'}
          </span>

          <div className="mono-label" style={{ marginBottom: '6px' }}>
            [CTA // ПРИЗЫВ К ДЕЙСТВИЮ]
          </div>
          <div className="post-cta-block">
            <StreamingText
              text={variant.cta}
              isStreaming={isStreaming}
              placeholder="Призыв к целевому действию (комментарий, сохранение, подписка)..."
            />
          </div>
        </div>

        {/* 4. Блок ХЭШТЕГИ [TAGS] */}
        <div
          role="button"
          tabIndex={0}
          onClick={() =>
            variant.hashtags.length > 0 &&
            copyToClipboard(variant.hashtags.join(' '), tagsTargetId)
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter' && variant.hashtags.length > 0) {
              copyToClipboard(variant.hashtags.join(' '), tagsTargetId);
            }
          }}
          className={`post-zone ${flashedId === tagsTargetId ? 'flash-copied' : ''}`}
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <span
            className="post-zone-badge"
            style={{
              color: copiedId === tagsTargetId ? 'var(--accent-primary)' : undefined,
              borderColor: copiedId === tagsTargetId ? 'var(--accent-primary)' : undefined,
              opacity: copiedId === tagsTargetId ? 1 : undefined,
            }}
          >
            {copiedId === tagsTargetId ? '[ TAGS · СКОПИРОВАНО ✓ ]' : '[ TAGS · КОПИРОВАТЬ ]'}
          </span>

          <div className="mono-label" style={{ marginBottom: '6px' }}>
            [TAGS // ХЭШТЕГИ И МЕТКИ]
          </div>
          <div>
            {variant.hashtags.length > 0 ? (
              variant.hashtags.map((tag, idx) => {
                const singleTagId = `tag-${variant.id}-${idx}`;
                const isTagCopied = copiedId === singleTagId;
                return (
                  <button
                    key={`${tag}-${idx}`}
                    type="button"
                    className={`hashtag-pill ${isTagCopied ? 'copied' : ''}`}
                    title="Клик — скопировать отдельный хэштег"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(tag, singleTagId);
                    }}
                  >
                    <span className="streaming-word">
                      {isTagCopied ? `${tag} ✓` : tag}
                    </span>
                  </button>
                );
              })
            ) : (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                {isStreaming ? '▋ ИНДЕКСАЦИЯ ТЕГОВ...' : '#хэштеги'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Нижняя техническая строка метрик карточки */}
      <div
        style={{
          padding: '8px 14px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-canvas)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}
      >
        <span>
          CHARS: {(variant.title + variant.body + variant.cta).length} · TAGS:{' '}
          {variant.hashtags.length}
        </span>
        <span>КЛИК ПО БЛОКУ → КОПИРОВАНИЕ СЕКЦИИ</span>
      </div>
    </motion.article>
  );
};
