# Resume Singularity — передача фронтенда разработчику

Документ описывает, **как устроен фронтенд**, **что уже сделано**, **как ходит в API**, и **на что обратить внимание**. Актуально на момент передачи проекта (React + Vite, без админ-панели на фронте).

---

## 1. Быстрый старт

```bash
npm install
npm run dev      # http://localhost:5173 (порт может отличаться)
npm run build    # dist/
npm run preview  # проверка production-сборки
npm run lint
```

**Production API:** `https://api.singularity-resume.ru`  
**Локально:** все запросы идут на `/api/...` — Vite проксирует на бэкенд (`vite.config.js`).

```js
// src/config/api.js
export const API_BASE_URL = '/api/';
```

Cookies сессии (`HttpOnly`) прокси переписывает на `localhost` в dev. В JS **нельзя** прочитать `ACCESS_TOKEN` / `REFRESH_TOKEN` — это нормально; сессия живёт через `credentials: 'include'`.

**Docker:** см. `README.md`, `Dockerfile`, `docker-compose.yml` — nginx отдаёт статику и проксирует `/api`.

---

## 2. Стек и принципы

| Технология | Версия / заметка |
|------------|------------------|
| React | 19 |
| Vite | 7 |
| React Router | 7 |
| State | Локальный `useState` / `useEffect`, **без** Redux/Zustand |
| Стили | CSS-модули по файлам компонентов (`.css` рядом с `.jsx`) |
| API | `fetch` + обёртка `apiClientJson` |
| i18n | Только русский UI |

**Не используется:** TypeScript, WebSocket, React Query, админ-панель на фронте.

---

## 3. Структура `src/`

```
src/
├── App.jsx                 # Роутинг, лоадер при смене страницы
├── main.jsx
├── index.css               # Глобальные стили, шрифты Stratos
├── config/
│   └── api.js              # API_BASE_URL, getImageUrl()
├── utils/
│   ├── apiClient.js        # Единая точка JSON-запросов, 401/403
│   ├── formatExperiencePeriod.js  # Даты опыта в резюме
│   └── hasStudentProfilePhoto.js
├── services/               # Тонкие обёртки над API
│   ├── authApi.js
│   ├── chatApi.js
│   ├── requestApi.js
│   ├── getApi.js           # GET student/recruiter/me, справочники
│   ├── studentApi.js       # Студенты, фильтры, опыт, образование
│   └── accountApi.js       # PATCH профиля (в UI сейчас не используется)
├── pages/
│   ├── Home.jsx            # Лендинг (публичный)
│   ├── Students.jsx        # Каталог студентов
│   ├── Resume.jsx          # Обёртка StudentResume
│   ├── Settings.jsx        # Настройки / профиль read-only
│   └── Chats.jsx           # Страница чатов
└── components/
    ├── auth/               # LoginModal, ProtectedRoute
    ├── chats/              # ChatsView, chatsView.css
    ├── studentResume/      # Резюме студента
    ├── applicationForm/    # Форма заявки рекрутера
    ├── settings/           # Секции заявок
    ├── studentsList/       # Карточки каталога
    ├── header/, footer/, banner/, ...
```

---

## 4. Маршруты

| Путь | Доступ | Страница |
|------|--------|----------|
| `/` | Публичный | Главная |
| `/students` | `ProtectedRoute` | Каталог студентов |
| `/studentsResume/:id` | Защищённый | Резюме |
| `/settings` | Защищённый | Настройки |
| `/chats` | Защищённый | Чаты |
| `/chats?chatId={uuid}` | Защищённый | Deep link в диалог |
| `/account` | Редирект → `/settings` | — |

`FloatingButton` — плавающая кнопка заявки (глобально в `App.jsx`).

---

## 5. Авторизация

### 5.1 Поток

1. `ProtectedRoute` проверяет `isAuthenticated()` из `authApi.js`.
2. Если нет — показывается `LoginModal` (не отдельная страница `/login`).
3. `POST /api/auth/login` с `credentials: 'include'` → cookies на бэкенде.
4. В `localStorage`: `isAuthenticated`, `isAuthenticated_time`, `resumeAuthUsername` (для чатов — кто автор сообщения).

### 5.2 Refresh и 401

`apiClient.js` при **401** (кроме повторной попытки): вызывает `refreshSession()` → `POST auth/refresh`, при неудаче:

- событие `resume:auth-required`;
- редирект на `/students`;
- флаг `showLoginAfter403` в `sessionStorage`.

### 5.3 403 и «мягкий» probe

`GET student/me` с ролью **рекрутера** даёт **403** — ожидаемо. В `ChatsView` / `Settings` сначала пробуют студента, потом `recruiter/me`. Для probe используйте `skipSessionClearOn403: true` там, где нужно (см. `getStudentMe` в коде).

### 5.4 Регистрация

`LoginModal`: регистрация студента и рекрутера через `registerStudent` / `registerRecruiter` (`authApi.js`).

### 5.5 Выход

`Header` → `logout()` / `logoutServer()`.

---

## 6. Слой API

### 6.1 `apiClientJson(endpoint, options)`

- Префикс: `API_BASE_URL` + endpoint (без ведущего слэша в endpoint).
- Всегда `credentials: 'include'`.
- Ошибки: `error.status`, `error.responseBody`.
- Много `console.log` — при передаче в prod можно почистить.

### 6.2 Фото

```js
getImageUrl('filename.jpg') // → /api/main/photo/filename.jpg
```

404 на фото — часто файл отсутствует в хранилище при наличии `imagePath` в DTO. В чатах на `<img>` вешали `onError` → инициалы (панель профиля **убрана**).

### 6.3 Пагинация Spring

Ответы могут быть `{ data: [...] }`, `{ content: [...] }` или массив. Для чатов:

```js
extractChatPageItems(res) // chatApi.js
```

---

## 7. Сервисы по доменам

### `authApi.js`
- `login`, `logout`, `logoutServer`, `refreshSession`
- `registerStudent`, `registerRecruiter`
- `isAuthenticated`, `AUTH_USERNAME_KEY`

### `studentApi.js`
- Каталог: `filterStudents`, `filterStudentCardsPage`, `getAllStudents`
- Резюме: `getStudentById`, `getSkillsByStudentId`, `getPortfolioByStudentId`
- **Опыт с компаниями:** `getExperienceDetailsByStudentId` — для каждого `experience` подгружает `GET company/{companyId}` (в DTO опыта имени компании нет)
- Образование: `getEducationDetailsByStudentId`
- Legacy: `sendStudentRequest` — предпочтительно `requestApi.createRequest`

### `getApi.js`
- `getStudentMe`, `getRecruiterMe`, `getStudentById`, `getRecruiterById`
- Справочники: speciality, skill, company, …

### `requestApi.js`
- `createRequest(body)` — заявка рекрутера (часто с `studentId`)
- `filterRequests(filter, page, size)`
- `postStudentDecision(requestId, { accepted, studentResponseText })`

### `chatApi.js`
- `getMyChats`, `getChatMessages`, `getChatSummary`
- `postChatTextMessage`, `postChatAttachment`, `markChatRead`
- `patchChatMessage` — **есть в API, в UI не подключено**
- `dedupeChatsByPeer(chats, role)` — **фронтовое** объединение дублей (см. ниже)

### `accountApi.js`
- `patchStudent`, `patchRecruiter`, `uploadStudentPhoto` — **намеренно не используются в Settings** (профиль меняет админ)

---

## 8. Что реализовано по фичам

### 8.1 Главная и каталог
- Лендинг, баннер, слайдер, проекты — в основном статика/моки + API студентов.
- `/students` — фильтрация через API, карточки `StudentsListCard`.

### 8.2 Резюме (`StudentResume.jsx`)
- Полная карточка студента, похожие студенты.
- **Опыт:** компания сверху, должность ниже; шрифты Stratos; стрелка раскрытия — `arrow_small.svg`.
- **Даты опыта:** `formatExperiencePeriodText()` — русские месяцы, длительность `(N месяцев)` / `(N лет)`.
- Кнопка «Связаться» → `ApplicationForm`.

### 8.3 Форма заявки (`ApplicationForm.jsx`)
- С страницы студента: `POST /request` с `studentId` + данные рекрутера.
- Без студента: `POST /recruiter` (общая заявка).
- Успех: опционально переход в чаты, если API вернул `appChatId` → `/chats?chatId=...`.
- Маска телефона, валидация email/telegram.

### 8.4 Настройки (`Settings.jsx`)
- **Только просмотр** профиля студента/рекрутера.
- Баннер для курса `NEW`.
- **Студент:** блок заявок `StudentRequestsSection` — список, принять/отклонить, ссылка в чат.
- **Рекрутер:** `RecruiterRequestsSection` — список своих заявок, ссылка в чат.
- Редактирование профиля и загрузка фото **убраны** (по ТЗ — модерация админом).

### 8.5 Чаты (`ChatsView.jsx`, `chatsView.css`)

**Макет:** полноэкранный (`100vh`), **2 колонки** — диалоги | переписка. Правая панель профиля **удалена** по запросу.

**Слева:**
- Навигация: Каталог · Чаты · Настройки
- Поиск по имени / превью
- Список чатов с аватарами-инициалами, временем, unread badge

**Центр:**
- Шапка: имя, подзаголовок (специальность/компания)
- Для рекрутера: кнопка **«Смотреть резюме»** → `/studentsResume/{studentId}` из `selectedChat.studentId`
- Сообщения: входящие/исходящие, системные, даты-разделители, удалённые/«изм.»
- Вложения, отправка текста

**Данные:** только **REST**, WebSocket **нет**. Новые сообщения собеседника — после перезагрузки/повторного открытия чата.

**Дедупликация чатов (`dedupeChatsByPeer`):**  
Бэкенд создаёт **отдельный chat на каждую заявку**. В UI один диалог на собеседника (по `studentId` или `recruiterId`), берётся чат с max `lastActivityAt`, unread суммируется. Подпись `· N заявки` при слиянии. `?chatId=` со старого id мапится на канонический через `chatAliasRef`.

**Исправления циклов запросов:** эффект загрузки сообщений **не** зависит от `chats` (иначе `refreshSummary` → бесконечный loop). `getChatMessages` при 500 пробует запрос **без** `sort=createdAt,asc`.

**Убрано:** кнопка-заглушка фильтра 📋, «Отправить оффер», редактирование сообщений в UI.

### 8.6 Аутентификация UI
- `LoginModal` — вход + регистрация
- `ProtectedRoute` + событие `resume:auth-required`

---

## 9. Роли пользователей

| Роль | Как определяется | Типичный UX |
|------|------------------|-------------|
| Студент | `GET student/me` OK | Каталог, резюме, чаты с рекрутерами, заявки в settings |
| Рекрутер | `GET recruiter/me` OK | Каталог, заявки студентам, чаты, «Смотреть резюме» |
| Рекрутер без профиля | `recruiter/me` → 404 | `recruiter_pending` в Settings |

`ChatsView.resolveMe()` — сначала student, потом recruiter.

---

## 10. Известные проблемы и ограничения

| Проблема | Где | Комментарий |
|---------|-----|-------------|
| `GET .../messages` → 500 | Бэкенд | Часто связано с `sort`; фронт делает fallback без sort. Если 500 остаётся — смотреть логи API |
| Дубли чатов в БД | Бэкенд | Фронт скрывает в списке; **история** в старых chat id не объединяется |
| 404 на `/api/main/photo/...` | Хранилище | Нет файла для `imagePath` |
| 403 на `student/me` | Ожидаемо для рекрутера | Не баг |
| Cookies `false` в логах AUTH | HttpOnly | Сессия может работать через include |
| Нет real-time чатов | Архитектура | Нужен WebSocket/polling на бэкенде + подписка на фронте |
| `patchChatMessage` | Не в UI | API готов |
| PATCH профиля / фото | `accountApi` | Намеренно отключено в Settings |
| Админ-панель | — | Вне scope фронта |
| Опечатка в ApplicationForm | `appвlicationForm__successWindow-text` | Класс с кириллической «в» — при правках CSS проверить |

---

## 11. Стили и шрифты

- Основной бренд: тёмная тема чатов `#0d0e16`, акцент `#b5127b`.
- Резюме: семейство **Stratos** (`src/assets/fonts/`, подключение в `index.css` / `studentResume.css`).
- Чаты: `chatsView.css` — основной файл; `chatsModal.css` — legacy стили модалки (страница `/chats` их почти не использует).

---

## 12. Чеклист для нового разработчика

1. Поднять `npm run dev`, залогиниться, пройти: каталог → резюме → заявка → чаты.
2. Проверить рекрутера и студента **разными** учётками.
3. Открыть Network: все запросы на `/api/...`, cookies уходят.
4. Прочитать `vite.config.js` proxy при CORS/cookie проблемах.
5. Перед фичами чатов — прочитать `ChatsView.jsx` + `chatApi.js` + `dedupeChatsByPeer`.
6. Перед резюме — `StudentResume.jsx` + `getExperienceDetailsByStudentId` + `formatExperiencePeriod.js`.
7. Не включать PATCH профиля без согласования (read-only settings).
8. `npm run build` перед деплоем.

---

## 13. Полезные эндпоинты (шпаргалка)

```
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /student/me
GET    /recruiter/me
GET    /student/{id}
POST   /student/filter
POST   /request
POST   /request/filter
POST   /request/{id}/student-decision
GET    /chat?page&size&sort
GET    /chat/{id}/messages
GET    /chat/{id}/summary
POST   /chat/{id}/messages
POST   /chat/{id}/messages/attachment
POST   /chat/{id}/read
GET    /main/photo/{path}
GET    /company/{id}
```

Полная спецификация — у команды бэкенда (в переписке/Confluence/OpenAPI). Фронт выровнен под REST из ТЗ чатов/заявок/профилей.

---

## 14. История изменений (кратко, передача 2025–2026)

- Выравнивание с API: чаты, заявки, auth refresh, read-only settings.
- Резюме: периоды опыта, названия компаний через `companyId`, UI/CSS резюме.
- Чаты: новый UI на весь экран, дедуп диалогов, фиксы бесконечных запросов, без профиля справа.
- ApplicationForm → `createRequest` + deep link в чат.
- Убраны: оффер-кнопка, фильтр-заглушка, панель профиля в чатах.

---

## 15. Контакты и репозиторий

- Репозиторий: `ResumeSingularity` (frontend root = этот проект).
- Production site: `https://singularity-resume.ru` (прокси `/api` на nginx).
- API host: `https://api.singularity-resume.ru`.

При вопросах по бизнес-логике (один chat на пару, 500 messages) — **сначала бэкенд**, фронт уже содержит обходы там, где возможно.

---

*Документ можно дополнять по мере изменений. Рекомендуется ссылаться на него в README: «Подробная передача → `DEVELOPER_HANDOFF.md`».*
