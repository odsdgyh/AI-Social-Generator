export type SocialPlatform = 'telegram' | 'youtube' | 'instagram' | 'tiktok';

export type PostSection = 'TITLE' | 'BODY' | 'CTA' | 'TAGS';

export interface PlatformFormatDef {
  id: string;
  name: string;
  badge: string;
  description: string;
  viewsAdvantage: string; // "⚡ Что больше набирает просмотров"
  easeAdvantage: string;  // "⏱️ Насколько легче сделать"
  isMaxViews?: boolean;
  isEasiest?: boolean;
}

export interface FormatAdvice {
  recommendedFormatId: string;
  recommendedFormatName: string;
  maxViewsAdvice: string;
  easiestAdvice: string;
  strategicTip: string;
}

export interface PostVariant {
  id: string;
  angleTitle: string; // Например: "Кейс / Сторителлинг"
  formatId?: string;
  formatName?: string;
  title: string;      // Заголовок
  body: string;       // Основной текст / сценарий / раскадровка
  cta: string;        // Призыв к действию
  hashtags: string[]; // Массив хэштегов
  rawTagsText?: string; // Потоковый буфер тегов во время стриминга
  productionTip?: string; // Совет по съемке / визуалу
}

export interface GenerationRecord {
  id: string;
  createdAt: number;
  topic: string;
  platform: SocialPlatform;
  formatId?: string;
  formatName?: string;
  variants: PostVariant[];
}

export interface PregenerateResponse {
  suggestedAngles: string[];
  detectedTone: string;
  formatAdvice?: FormatAdvice;
  suggestedFormatId?: string;
}

export interface StreamChunkEvent {
  variantIndex: number;
  section: PostSection;
  text: string;
  angleTitle?: string;
  formatName?: string;
}

export interface StreamDoneEvent {
  generationId: string;
  timestamp: number;
}

export interface StreamErrorEvent {
  message: string;
  code?: string;
}

export interface PresetExample {
  id: string;
  code: string;
  label: string;
  platform: SocialPlatform;
  formatId?: string;
  topic: string;
  suggestedAngles: string[];
  detectedTone: string;
}
