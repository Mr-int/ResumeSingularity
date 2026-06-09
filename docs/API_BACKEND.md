# Singularity Resume — спецификация API для фронтенда

Самодостаточный справочник: URL, методы, тела запросов и порядок вызовов.

## 1. Базовый URL

| Режим | Базовый префикс | Пример |
|-------|-----------------|--------|
| Локальная разработка | `/api/` | `http://localhost:5173/api/auth/login` |
| Prod / staging | `VITE_API_URL` | `https://test-api.singularity-resume.ru/auth/login` |

В dev Vite проксирует `/api/*` → `VITE_API_PROXY_TARGET` (по умолчанию `http://localhost:8080/*`, убирает `/api`).  
WebSocket в dev: `ws://localhost:5173/ws` → прокси на бэкенд.

Переменные: `VITE_API_URL`, `VITE_API_PROXY_TARGET`.

## 2. Принципы запросов

### Авторизация — cookie-сессия

После login/register: cookies `ACCESS_TOKEN`, `REFRESH_TOKEN`.  
Почти все запросы: `credentials: 'include'`.

**Без cookies:** `GET public/vitrina/home`, `GET public/registration/*`, `POST public/analytics/events`.

### Обработка ответов

- Успех: JSON, пустое тело → `{}`
- **401:** `POST auth/refresh` → повторить запрос один раз → при повторном 401 разлогин
- **403:** не разлогинивать (probe `student/me`, `recruiter/me` — «не твоя роль»)
- Сеть: «Не удалось подключиться к серверу API.»

### Пагинация (Spring Page)

Массив: `content` → `data` → `value`. Метаданные: `page`, `size`, `totalElements`, `totalPages`.  
Query: `?page=0&size=20`, сортировка `&sort=lastActivityAt,desc`.

### Картинки

`{BASE_URL}main/photo/{imagePath}` (если не `http(s)://`).

## 3. Сессия после `GET auth/me`

| Поле | localStorage |
|------|--------------|
| username | логин |
| role | STUDENT, RECRUITER, ADMIN |
| accountStatus | PENDING_APPROVAL, APPROVED, … |
| hintsDisabled | boolean |

Флаг входа: `isAuthenticated` + timestamp (TTL 24ч).  
События: `resume:auth-changed`, `resume:auth-required`.

## 4. Реализация на фронте

| Модуль | Файл |
|--------|------|
| Базовый URL | `src/config/api.js` |
| HTTP-клиент | `src/utils/apiClient.js` |
| Пагинация | `src/utils/pagination.js` |
| Auth | `src/services/authApi.js` |
| Верификация телефона | `src/services/verificationApi.js` |
| Публичное API | `src/services/publicApi.js` |
| Каталог студентов | `src/services/studentApi.js` → `fetchStudentCardsPage` |
| Чаты REST | `src/services/chatApi.js` |
| Профиль | `src/services/profileApi.js` |

## 5. Ключевые сценарии

### Вход

1. `POST auth/logout` (сброс)
2. `POST auth/login`
3. `GET auth/me` → сохранить role, accountStatus
4. Редирект: STUDENT → `/settings`, RECRUITER APPROVED → `/students`, PENDING → `/settings`

### Регистрация

1. `POST verification/phone/start` → `verificationId`
2. Polling `GET verification/phone/{id}/status` (2.5 с) или `POST .../confirm-code`
3. `POST auth/register-student` / `register-recruiter` с `phoneVerificationId`
4. `GET auth/me`

### Каталог `/students`

`POST student/cardsFilter?page=0&size=5` с фильтром `{ useDefaultRanking, findString, course, bornAfter, specialitiesIds }`.  
При 401/403 или для гостей/PENDING: `POST public/students/cards`.

## 6. WebSocket (чаты)

- URL: `{API_ORIGIN}/ws` (SockJS)
- STOMP, подписка `/topic/chats/{chatId}`
- Reconnect каждые 5 с
- **Статус:** REST чаты реализованы; WebSocket — в планах (`sockjs-client` + `@stomp/stompjs`)

## 7. Защита маршрутов

| Маршрут | Доступ |
|---------|--------|
| `/` | всем |
| `/students`, `/studentsResume/:id` | вход + роль (PENDING рекрутёр — ограниченный каталог) |
| `/vacancies`, `/projects` | APPROVED / STUDENT / ADMIN |
| `/chats` | вход + `profile/communication-readiness.ready === true` |

При отказе без входа: `authReturnTo` в sessionStorage + модал входа.

## 8. Известные особенности бэкенда

- `student/me` → 403 для рекрутёра — норма
- `chat/{id}/messages` иногда 500 с `sort` — повторить без sort
- Проекты в поле `value`
- ID студента в чате может отличаться от public-каталога
- PENDING рекрутёр не может PATCH профиля

---

Полный перечень эндпоинтов (auth, onboarding, vacancies, request, chat и т.д.) — в исходной спецификации проекта; при расширении API добавляйте сервисы в `src/services/` по образцу существующих.
