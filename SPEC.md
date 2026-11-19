Документ 2: SPEC.md (Technical Specification)
1. Архитектура и технический стек
Frontend: React 18+, TypeScript, Vite (или Next.js App Router).

Управление состоянием: Zustand (для текущего стейта генерации, стриминга и UI) + localStorage / IndexedDB (или легковесный бэкенд на Node.js + Express + SQLite для персистентной истории).

Backend / API Layer: Node.js (Express) прокси-сервер для скрытия GEMINI_API_KEY и организации SSE-стриминга.

AI SDK: Официальный @google/genai SDK.

Для этапа прегенерации (быстрые хуки/уточнения): gemini-2.5-flash или gemini-2.5-flash-lite (минимальная задержка).

Для основной потоковой генерации постов: gemini-2.5-flash (оптимальный баланс скорости стриминга и качества русского текста).

2. Потоковый протокол и парсинг (Streaming & Parsing Strategy)
При стриминге классический JSON.parse() не работает, пока поток не завершен полностью. Чтобы выводить 3 варианта одновременно или последовательно по блокам в реальном времени, используется разделительный протокол (Delimiter-based Streaming Protocol):

2.1. Формат потока от модели
Системный промпт жестко задает структуру вывода через уникальные маркеры, которые парсятся на клиенте на лету с помощью регулярных выражений или конечного автомата (State Machine):

Plaintext
===VARIANT_1===
[TITLE]
Текст заголовка...
[BODY]
Основной текст поста...
[CTA]
Текст призыва к действию...
[TAGS]
#тег1 #тег2 #тег3

===VARIANT_2===
...
Альтернативный вариант (при использовании Structured Outputs без посимвольного стриминга внутри JSON-полей): параллельный запуск 3 независимых стримов Promise.all (по одному на каждую карточку варианта), где каждый стрим заполняет свою карточку в UI одновременно. Параллельный стриминг 3 карточек дает лучший UX: пользователь видит, как все 3 варианта пишутся синхронно за ~2–3 секунды.

3. Спецификация API эндпоинтов (Backend)
POST /api/pregenerate
Быстрый анализ введенной идеи для прегенерации углов подачи и тональности.

Request Body:

JSON
{
  "topic": "Курсы по вайбкодингу и ИИ-разработке для новичков",
  "platform": "telegram"
}
Response (JSON, ~400-700ms):

JSON
{
  "suggestedAngles": [
    "Разбор мифа: почему код больше не нужно учить годами",
    "Личный кейс: как собрать рабочий MVP за вечер",
    "Прямой оффер: программа курса и старт потока"
  ],
  "detectedTone": "Практичный, экспертный"
}
POST /api/generate-stream
Основной эндпоинт с поддержкой text/event-stream (SSE).

Request Body:

JSON
{
  "topic": "Курсы по вайбкодингу и ИИ-разработке для новичков",
  "platform": "telegram",
  "variantsCount": 3,
  "selectedAngles": ["Разбор мифа...", "Личный кейс...", "Прямой оффер..."]
}
SSE Events:

event: chunk -> data: {"variantIndex": 0, "section": "BODY", "text": "токен..."}

event: done -> data: {"generationId": "uuid-v4", "timestamp": 1762950000000}

event: error -> data: {"message": "Rate limit exceeded"}

4. Схемы данных (Data Models)
TypeScript
export type SocialPlatform = 'telegram' | 'youtube' | 'instagram';

export interface PostVariant {
  id: string;
  angleTitle: string; // Например: "Кейс / Сторителлинг"
  title: string;      // Заголовок
  body: string;       // Основной текст
  cta: string;        // Призыв к действию
  hashtags: string[]; // Массив хэштегов
}

export interface GenerationRecord {
  id: string;
  createdAt: number;
  topic: string;
  platform: SocialPlatform;
  variants: PostVariant[];
}
5. Логика системных промптов по соцсетям (Prompt Engineering)
На бэкенде формируется матрица правил PLATFORM_RULES[platform]:

telegram: Запрет на воду и штампы («В современном мире...», «Не секрет, что...»). Короткие абзацы по 2–3 предложения, плотная подача мысли, тире вместо дефисов, максимум 3–4 хэштега в самом низу.

instagram: Первая строка (Title) до 60 символов — стоп-скролл триггер. Текст разбивается воздухом, список буллитами, CTA направлен на сохранение поста или комментарий триггерного слова в Директ. До 8–10 целевых хэштегов.

youtube: Заголовок до 70 символов с высоким CTR. В Body — первые 2 строки под SEO-сниппет, затем краткая выжимка о чем видео и блок таймкодов 00:00 Вступление. В тегах — ключевые слова через запятую или решетку.

6. Механика копирования и хранилища
Clipboard API: Утилита copyToClipboard(text: string, targetId: string) использует navigator.clipboard.writeText(). Хранит copiedId в локальном стейте на 1500ms для отрисовки состояния «Скопировано».

Хранилище истории:

Если приложение полностью клиентское (или с тонким API-прокси) — запись в localStorage под ключом content_forge_history_v1 (с лимитом до 100 последних генераций и автоочисткой старых).

Если с локальной БД — таблица generations в SQLite (id TEXT PRIMARY KEY, topic TEXT, platform TEXT, variants_json TEXT, created_at INTEGER).