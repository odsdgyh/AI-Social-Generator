# CONTENT_ENGINE // v1.0 (ContentForge / Social Engine)

Инженерный веб-инструмент для потоковой генерации структурированного контента под **Telegram**, **YouTube** и **Instagram** через **Google Gemini API (`@google/genai`)**, собранный строго по спецификациям [PRD.md](file:///E:/AI%20Workspace/AI-Social-Generator/PRD.md), [SPEC.md](file:///E:/AI%20Workspace/AI-Social-Generator/SPEC.md) и [DESIGN.md](file:///E:/AI%20Workspace/AI-Social-Generator/DESIGN.md).

## Архитектура и стек
- **Frontend**: React 18, TypeScript, Vite, Framer Motion (`spring` физика), Zustand
- **Backend / API Layer**: Node.js + Express (`server/index.ts`), SSE-стриминг (`text/event-stream`), параллельная потоковая генерация 3 вариантов (`Promise.all`) и потоковый конечный автомат парсинга секций `[TITLE]`, `[BODY]`, `[CTA]`, `[TAGS]`
- **AI SDK**: `@google/genai` (`gemini-2.5-flash`) + встроенный потоковый синтезатор реального времени (если ключ `GEMINI_API_KEY` еще не указан)
- **Хранилище истории**: `localStorage` (`content_forge_history_v1`, до 100 записей) + серверное хранилище `server/data/generations.json`

## Быстрый старт

1. Установите зависимости:
   ```bash
   npm install
   ```
2. (Опционально) Создайте файл `.env` в корне проекта и укажите ваш ключ Gemini API (также ключ можно задать прямо в интерфейсе, кликнув по индикатору `GEMINI-2.5-FLASH` в верхней панели):
   ```env
   GEMINI_API_KEY=ваш_ключ_gemini
   PORT=3001
   ```
3. Запустите проект в режиме разработки (одновременно запускаются Express-сервер на порту `3001` и Vite на порту `5173`):
   ```bash
   npm run dev
   ```
4. Откройте в браузере: `http://localhost:5173`
