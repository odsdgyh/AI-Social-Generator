import { create } from 'zustand';
import {
  SocialPlatform,
  PostVariant,
  GenerationRecord,
  PresetExample,
  FormatAdvice,
  StreamChunkEvent,
  StreamDoneEvent,
  StreamErrorEvent,
} from '../types';
import { PLATFORM_FORMATS } from '../constants/formats';
import {
  buildContextualFallbackAdvice,
  buildSynthesizedVariantStreamText,
  SectionStreamParser,
} from '../../server/prompts';

const HISTORY_STORAGE_KEY = 'content_forge_history_v1';
const API_KEY_STORAGE_KEY = 'content_forge_gemini_api_key_v1';
const MAX_HISTORY_ITEMS = 100;

export const DEFAULT_PLATFORM_FORMATS: Record<SocialPlatform, string> = {
  tiktok: 'video',
  youtube: 'shorts',
  telegram: 'post',
  instagram: 'reels',
};

export const PRESET_EXAMPLES: PresetExample[] = [
  {
    id: 'preset-tiktok-3d',
    code: 'ПРИМЕР 01',
    label: 'Первое видео о своих навыках в 3D (TikTok)',
    platform: 'tiktok',
    formatId: 'video',
    topic: 'Хочу сделать первое видео о своих навыках в 3D: показать процесс моделирования от серого куба до фотореалистичного рендера с неоновым светом.',
    suggestedAngles: [
      'Timelapse процесса: создание сложного объекта с нуля за 15 сек',
      'Контринтуитивный хук: «3 ошибки в 3D, из-за которых работы выглядят дешево»',
      'Было / Стало: трансформация от серого куба до фотореалистичной сцены',
    ],
    detectedTone: 'Динамичный, вовлекающий',
  },
  {
    id: 'preset-tg-course',
    code: 'ПРИМЕР 02',
    label: 'Анонс инженерного кейса в Telegram (Альбом / Пост)',
    platform: 'telegram',
    formatId: 'album',
    topic:
      'Практический интенсив по ИИ-разработке и архитектурному вайбкодингу: как инженеру собирать продакшен-сервисы в 4 раза быстрее с помощью LLM-агентов и строгих спецификаций (PRD, SPEC, DESIGN).',
    suggestedAngles: [
      'Инженерный кейс: как спецификация экономит 70% времени на отладке',
      'Разбор ошибки: почему промпты без архитектуры превращаются в техдолг',
      'Прямой оффер: программа спринта и доступ к закрытому репозиторию',
    ],
    detectedTone: 'Практичный, инженерный',
  },
  {
    id: 'preset-ig-reels',
    code: 'ПРИМЕР 03',
    label: 'Сценарий Reels и Карусель для Instagram',
    platform: 'instagram',
    formatId: 'reels',
    topic:
      'Запуск B2B-сервиса автоматической аналитики отделов продаж: ИИ слушает звонки, подсвечивает слитые сделки за 30 секунд и заполняет карточки в CRM без участия менеджера.',
    suggestedAngles: [
      'Стоп-скролл хук: где отдел продаж теряет до 35% выручки каждую неделю',
      'Трансформация До / После: 0 минут на ручное заполнение CRM',
      'Прямой триггер на кодовое слово АУДИТ в Директ (разбор 10 звонков)',
    ],
    detectedTone: 'Динамичный, продуктовый',
  },
  {
    id: 'preset-yt-release',
    code: 'ПРИМЕР 04',
    label: 'Shorts & Длинный ролик для YouTube',
    platform: 'youtube',
    formatId: 'shorts',
    topic:
      'Большой технический разбор локальных и облачных LLM-моделей 2026 года в реальных задачах программирования: замеры задержки TTFT, стоимость токенов и стресс-тест на кодовой базе.',
    suggestedAngles: [
      'Инженерный бенчмарк: честное сравнение скорости и точности на одном проекте',
      'Контринтуитивный вывод: почему дорогая модель не всегда пишет лучший код',
      'Пошаговый гайд: оптимальный стек моделей под разные задачи разработки',
    ],
    detectedTone: 'Аналитический, экспертный',
  },
];

function loadHistoryFromStorage(): GenerationRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY_ITEMS) : [];
  } catch {
    return [];
  }
}

function saveHistoryToStorage(records: GenerationRecord[]) {
  try {
    localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(records.slice(0, MAX_HISTORY_ITEMS))
    );
  } catch {
    // ignore storage quota errors
  }
}

function parseHashtags(raw: string): string[] {
  if (!raw.trim()) return [];
  const matches = raw.match(/#[^\s#,]+/g);
  if (matches && matches.length > 0) {
    return Array.from(new Set(matches));
  }
  return raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t : `#${t}`));
}

interface ContentState {
  platform: SocialPlatform;
  selectedFormatId: string;
  topic: string;
  variantsCount: 2 | 3;

  // Format & Pre-generation state
  isPregenerating: boolean;
  pregenOpen: boolean;
  suggestedAngles: string[];
  selectedAngles: string[];
  detectedTone: string;
  formatAdvice: FormatAdvice | null;

  // Streaming & Results state
  isStreaming: boolean;
  variants: PostVariant[];
  activeVariantTab: number;
  viewMode: 'tabs' | 'feed';
  error: { code: string; message: string } | null;

  // History Drawer state
  history: GenerationRecord[];
  isHistoryOpen: boolean;
  historyFilterPlatform: 'all' | SocialPlatform;
  historySearchQuery: string;

  // Copy feedback state
  copiedId: string | null;
  flashedId: string | null;

  // API status & key
  apiKey: string;
  hasServerKey: boolean;
  isApiConfigOpen: boolean;

  // Actions
  setPlatform: (platform: SocialPlatform) => void;
  setSelectedFormatId: (formatId: string) => void;
  setTopic: (topic: string) => void;
  setVariantsCount: (count: 2 | 3) => void;
  toggleAngle: (angle: string) => void;
  setActiveVariantTab: (index: number) => void;
  setViewMode: (mode: 'tabs' | 'feed') => void;
  setHistoryOpen: (open: boolean) => void;
  setHistoryFilterPlatform: (filter: 'all' | SocialPlatform) => void;
  setHistorySearchQuery: (query: string) => void;
  setApiKey: (key: string) => void;
  setApiConfigOpen: (open: boolean) => void;
  checkServerStatus: () => Promise<void>;

  loadPreset: (preset: PresetExample) => void;
  triggerPregenerate: (customFormatId?: string) => Promise<void>;
  startGeneration: (opts?: { simulateError?: boolean }) => Promise<void>;
  stopGeneration: () => void;
  clearError: () => void;

  restoreFromHistory: (record: GenerationRecord) => void;
  deleteHistoryItem: (id: string) => void;
  clearAllHistory: () => void;

  copyToClipboard: (text: string, targetId: string) => Promise<void>;
}

let activeAbortController: AbortController | null = null;
let copyTimeoutId: ReturnType<typeof setTimeout> | null = null;
let flashTimeoutId: ReturnType<typeof setTimeout> | null = null;

export const useContentStore = create<ContentState>((set, get) => ({
  platform: 'tiktok',
  selectedFormatId: 'video',
  topic: '',
  variantsCount: 3,

  isPregenerating: false,
  pregenOpen: false,
  suggestedAngles: [],
  selectedAngles: [],
  detectedTone: 'Динамичный, визуальный',
  formatAdvice: null,

  isStreaming: false,
  variants: [],
  activeVariantTab: 0,
  viewMode: 'tabs',
  error: null,

  history: loadHistoryFromStorage(),
  isHistoryOpen: false,
  historyFilterPlatform: 'all',
  historySearchQuery: '',

  copiedId: null,
  flashedId: null,

  apiKey: (() => {
    try {
      return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  })(),
  hasServerKey: false,
  isApiConfigOpen: false,

  setPlatform: (platform) => {
    const defaultFormat = DEFAULT_PLATFORM_FORMATS[platform] || 'video';
    set({ platform, selectedFormatId: defaultFormat, error: null });
    const { topic, pregenOpen } = get();
    if (topic.trim() && pregenOpen) {
      get().triggerPregenerate(defaultFormat);
    }
  },

  setSelectedFormatId: (selectedFormatId) => {
    set({ selectedFormatId });
    const { topic, pregenOpen } = get();
    if (topic.trim() && pregenOpen) {
      get().triggerPregenerate(selectedFormatId);
    }
  },

  setTopic: (topic) => {
    set({ topic });
  },

  setVariantsCount: (variantsCount) => {
    set({ variantsCount, activeVariantTab: 0 });
  },

  toggleAngle: (angle) => {
    const { selectedAngles } = get();
    const exists = selectedAngles.includes(angle);
    if (exists) {
      set({ selectedAngles: selectedAngles.filter((a) => a !== angle) });
    } else {
      set({ selectedAngles: [...selectedAngles, angle] });
    }
  },

  setActiveVariantTab: (activeVariantTab) => set({ activeVariantTab }),
  setViewMode: (viewMode) => set({ viewMode }),
  setHistoryOpen: (isHistoryOpen) => set({ isHistoryOpen }),
  setHistoryFilterPlatform: (historyFilterPlatform) => set({ historyFilterPlatform }),
  setHistorySearchQuery: (historySearchQuery) => set({ historySearchQuery }),

  setApiKey: (apiKey) => {
    try {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
    } catch {
      // ignore
    }
    set({ apiKey: apiKey.trim() });
  },

  setApiConfigOpen: (isApiConfigOpen) => set({ isApiConfigOpen }),

  checkServerStatus: async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        set({ hasServerKey: Boolean(data.hasServerKey) });
      }
    } catch {
      // ignore
    }
  },

  loadPreset: (preset) => {
    const formatId = preset.formatId || DEFAULT_PLATFORM_FORMATS[preset.platform] || 'video';
    set({
      platform: preset.platform,
      selectedFormatId: formatId,
      topic: preset.topic,
      suggestedAngles: preset.suggestedAngles,
      selectedAngles: [...preset.suggestedAngles],
      detectedTone: preset.detectedTone,
      pregenOpen: true,
      error: null,
    });
    get().triggerPregenerate(formatId);
  },

  triggerPregenerate: async (customFormatId) => {
    const { topic, platform, selectedFormatId, apiKey } = get();
    const cleanTopic = topic.trim();
    if (!cleanTopic) return;

    const effFormatId = customFormatId || selectedFormatId;
    set({ isPregenerating: true, pregenOpen: true, error: null });

    try {
      const res = await fetch('/api/pregenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: cleanTopic,
          platform,
          formatId: effFormatId,
          apiKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const angles: string[] = Array.isArray(data.suggestedAngles) ? data.suggestedAngles : [];
        set({
          suggestedAngles: angles,
          selectedAngles: angles,
          detectedTone: data.detectedTone || 'Практичный, экспертный',
          formatAdvice: data.formatAdvice || null,
          selectedFormatId: data.suggestedFormatId || effFormatId,
          isPregenerating: false,
        });
        return;
      }
    } catch {
      // server not available (e.g. static GitHub Pages)
    }

    const fallback = buildContextualFallbackAdvice(cleanTopic, platform, effFormatId);
    set({
      suggestedAngles: fallback.suggestedAngles,
      selectedAngles: fallback.suggestedAngles,
      detectedTone: fallback.detectedTone,
      formatAdvice: fallback.formatAdvice,
      selectedFormatId: fallback.formatAdvice.recommendedFormatId,
      isPregenerating: false,
    });
  },

  startGeneration: async (opts) => {
    const {
      topic,
      platform,
      selectedFormatId,
      variantsCount,
      selectedAngles,
      suggestedAngles,
      apiKey,
    } = get();
    const cleanTopic = topic.trim();
    if (!cleanTopic) return;

    if (activeAbortController) {
      activeAbortController.abort();
    }
    const abortController = new AbortController();
    activeAbortController = abortController;

    const effectiveAngles =
      selectedAngles.length > 0
        ? selectedAngles
        : suggestedAngles.length > 0
          ? suggestedAngles
          : [
              'Ключевой разбор и демонстрация',
              'Разбор частой ошибки новичков',
              'Прямой результат и призыв',
            ];

    const initialVariants: PostVariant[] = Array.from({ length: variantsCount }, (_, idx) => ({
      id: `var-${Date.now()}-${idx}`,
      angleTitle: effectiveAngles[idx] || `Вариант 0${idx + 1}`,
      formatId: selectedFormatId,
      title: '',
      body: '',
      cta: '',
      hashtags: [],
      rawTagsText: '',
    }));

    set({
      isStreaming: true,
      error: null,
      variants: initialVariants,
      activeVariantTab: 0,
    });

    let streamedViaServer = false;

    try {
      const response = await fetch('/api/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: cleanTopic,
          platform,
          formatId: selectedFormatId,
          variantsCount,
          selectedAngles: effectiveAngles,
          apiKey,
          simulateError: opts?.simulateError || false,
        }),
        signal: abortController.signal,
      });

      if (response.ok && response.body) {
        streamedViaServer = true;
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let sseBuffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const events = sseBuffer.split('\n\n');
          sseBuffer = events.pop() || '';

          for (const rawEvent of events) {
            const lines = rawEvent.split('\n');
            let eventType = 'message';
            let dataStr = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                dataStr += line.slice(5).trim();
              }
            }

            if (!dataStr) continue;

            if (eventType === 'chunk') {
              const payload = JSON.parse(dataStr) as StreamChunkEvent;
              set((state) => {
                const updated = [...state.variants];
                const target = updated[payload.variantIndex];
                if (!target) return state;

                const next = { ...target };
                if (payload.angleTitle) next.angleTitle = payload.angleTitle;
                if (payload.formatName) next.formatName = payload.formatName;

                if (payload.section === 'TITLE') {
                  next.title = (next.title + payload.text).replace(/^\n+/, '');
                } else if (payload.section === 'BODY') {
                  next.body = (next.body + payload.text).replace(/^\n+/, '');
                } else if (payload.section === 'CTA') {
                  next.cta = (next.cta + payload.text).replace(/^\n+/, '');
                } else if (payload.section === 'TAGS') {
                  const rawTags = (next.rawTagsText || '') + payload.text;
                  next.rawTagsText = rawTags;
                  next.hashtags = parseHashtags(rawTags);
                }

                updated[payload.variantIndex] = next;
                return { variants: updated };
              });
            } else if (eventType === 'done') {
              const donePayload = JSON.parse(dataStr) as StreamDoneEvent & {
                formatId?: string;
                formatName?: string;
              };
              const finalizedVariants = get().variants.map((v) => ({
                id: v.id,
                angleTitle: v.angleTitle.trim(),
                formatId: donePayload.formatId || v.formatId,
                formatName: donePayload.formatName || v.formatName,
                title: v.title.trim(),
                body: v.body.trim(),
                cta: v.cta.trim(),
                hashtags:
                  v.hashtags.length > 0
                    ? v.hashtags
                    : parseHashtags(v.rawTagsText || '#content_engine'),
              }));

              const newRecord: GenerationRecord = {
                id: donePayload.generationId || `gen-${Date.now()}`,
                createdAt: donePayload.timestamp || Date.now(),
                topic: cleanTopic,
                platform,
                formatId: donePayload.formatId || selectedFormatId,
                formatName: donePayload.formatName,
                variants: finalizedVariants,
              };

              const nextHistory = [
                newRecord,
                ...get().history.filter((h) => h.id !== newRecord.id),
              ].slice(0, MAX_HISTORY_ITEMS);

              saveHistoryToStorage(nextHistory);
              fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRecord),
              }).catch(() => {});

              set({
                variants: finalizedVariants,
                history: nextHistory,
                isStreaming: false,
              });
            } else if (eventType === 'error') {
              const errPayload = JSON.parse(dataStr) as StreamErrorEvent;
              set({
                isStreaming: false,
                error: {
                  code: errPayload.code || 'ERR_STREAM_INTERRUPTED',
                  message:
                    errPayload.message ||
                    'Поток генерации был неожиданно прерван.',
                },
              });
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        set({ isStreaming: false });
        return;
      }
    }

    // Автономный клиентский стриминг (для статического размещения на GitHub Pages)
    if (!streamedViaServer) {
      const currentFormatDef =
        PLATFORM_FORMATS[platform]?.find((f) => f.id === selectedFormatId) ||
        PLATFORM_FORMATS[platform]?.[0];
      const formatName = currentFormatDef?.name || 'Видео';

      await Promise.all(
        effectiveAngles.slice(0, variantsCount).map(async (angle, variantIndex) => {
          const fullText = buildSynthesizedVariantStreamText(
            cleanTopic,
            platform,
            angle,
            variantIndex,
            selectedFormatId
          );
          const parser = new SectionStreamParser((section, text) => {
            set((state) => {
              const updated = [...state.variants];
              const target = updated[variantIndex];
              if (!target) return state;

              const next = { ...target, formatName };
              if (section === 'TITLE') {
                next.title = (next.title + text).replace(/^\n+/, '');
              } else if (section === 'BODY') {
                next.body = (next.body + text).replace(/^\n+/, '');
              } else if (section === 'CTA') {
                next.cta = (next.cta + text).replace(/^\n+/, '');
              } else if (section === 'TAGS') {
                const rawTags = (next.rawTagsText || '') + text;
                next.rawTagsText = rawTags;
                next.hashtags = parseHashtags(rawTags);
              }
              updated[variantIndex] = next;
              return { variants: updated };
            });
          });

          const tokens = fullText.match(/(\[(?:TITLE|BODY|CTA|TAGS)\]|\S+\s*|\n+)/g) || [fullText];
          await new Promise((r) => setTimeout(r, variantIndex * 60));

          for (const token of tokens) {
            if (abortController.signal.aborted) break;
            parser.push(token);
            await new Promise((r) => setTimeout(r, 22));
          }
          parser.flush();
        })
      );

      const finalizedVariants = get().variants.map((v) => ({
        id: v.id,
        angleTitle: v.angleTitle.trim(),
        formatId: selectedFormatId,
        formatName,
        title: v.title.trim(),
        body: v.body.trim(),
        cta: v.cta.trim(),
        hashtags:
          v.hashtags.length > 0 ? v.hashtags : parseHashtags(v.rawTagsText || '#content_engine'),
      }));

      const newRecord: GenerationRecord = {
        id: `gen-${Date.now()}`,
        createdAt: Date.now(),
        topic: cleanTopic,
        platform,
        formatId: selectedFormatId,
        formatName,
        variants: finalizedVariants,
      };

      const nextHistory = [newRecord, ...get().history.filter((h) => h.id !== newRecord.id)].slice(
        0,
        MAX_HISTORY_ITEMS
      );
      saveHistoryToStorage(nextHistory);

      set({
        variants: finalizedVariants,
        history: nextHistory,
        isStreaming: false,
      });
    }
  },

  stopGeneration: () => {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
    set({ isStreaming: false });
  },

  clearError: () => set({ error: null }),

  restoreFromHistory: (record) => {
    set({
      platform: record.platform,
      selectedFormatId: record.formatId || DEFAULT_PLATFORM_FORMATS[record.platform] || 'video',
      topic: record.topic,
      variants: record.variants,
      variantsCount: record.variants.length === 2 ? 2 : 3,
      activeVariantTab: 0,
      isHistoryOpen: false,
      error: null,
    });
  },

  deleteHistoryItem: (id) => {
    const nextHistory = get().history.filter((item) => item.id !== id);
    saveHistoryToStorage(nextHistory);
    fetch(`/api/history/${id}`, { method: 'DELETE' }).catch(() => {});
    set({ history: nextHistory });
  },

  clearAllHistory: () => {
    saveHistoryToStorage([]);
    set({ history: [] });
  },

  copyToClipboard: async (text, targetId) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    if (flashTimeoutId) clearTimeout(flashTimeoutId);
    if (copyTimeoutId) clearTimeout(copyTimeoutId);

    set({ flashedId: targetId, copiedId: targetId });

    flashTimeoutId = setTimeout(() => {
      set({ flashedId: null });
    }, 300);

    copyTimeoutId = setTimeout(() => {
      set({ copiedId: null });
    }, 1500);
  },
}));
