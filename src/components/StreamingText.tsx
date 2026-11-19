import React from 'react';

interface StreamingTextProps {
  text: string;
  isStreaming?: boolean;
  placeholder?: string;
}

/**
 * Оборачивает слова потока в <span class="streaming-word">,
 * обеспечивая плавное оптическое проявление (Word-by-Word Blur Fade-In)
 * по спецификации DESIGN.md (п. 6.1).
 */
export const StreamingText: React.FC<StreamingTextProps> = ({
  text,
  isStreaming = false,
  placeholder = 'Ожидание потока данных...',
}) => {
  if (!text) {
    return (
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--text-muted)',
        }}
      >
        {isStreaming ? '▋ СИНТЕЗ ПОТОКА...' : placeholder}
      </span>
    );
  }

  // Разбиваем текст с сохранением пробелов и переносов строк,
  // чтобы каждый токен имел стабильный индекс и анимировался один раз при появлении.
  const tokens = text.split(/(\s+)/);

  return (
    <>
      {tokens.map((token, idx) => {
        if (/^\s+$/.test(token)) {
          return <React.Fragment key={`ws-${idx}`}>{token}</React.Fragment>;
        }
        return (
          <span key={`w-${idx}`} className="streaming-word">
            {token}
          </span>
        );
      })}
    </>
  );
};
