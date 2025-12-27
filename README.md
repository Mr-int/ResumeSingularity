# Resume Singularity - Frontend

Frontend приложение для платформы Resume Singularity, построенное на React + Vite.

## 🚀 Быстрый старт

### Разработка

```bash
npm install
npm run dev
```

### Production сборка

```bash
npm run build
npm run preview
```

## 🐳 Docker

### Сборка и запуск через Docker

```bash
# Сборка образа
docker build -t resume-singularity .

# Запуск контейнера
docker run -p 80:80 resume-singularity
```

### Docker Compose

```bash
# Запуск через docker-compose
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

## 📁 Структура проекта

```
src/
├── components/     # React компоненты
├── pages/          # Страницы приложения
├── services/       # API сервисы
├── config/         # Конфигурация
└── assets/         # Статические ресурсы
```

## 🔧 Технологии

- React 19
- Vite 7
- React Router DOM 7
- Nginx (для production)

## 🌐 API

Приложение использует API через прокси:
- В режиме разработки: Vite прокси (`/api/`)
- В production: Nginx прокси (`/api/`)

Базовый URL API: `https://api.singularity-resume.ru/`

## 📝 Основные функции

- Просмотр списка студентов
- Детальные резюме студентов
- Портфолио проектов
- Система аутентификации
- Защищенные маршруты

## 🔐 Аутентификация

Для доступа к защищенным страницам требуется авторизация через `/auth/login`.

## 📦 Развертывание

Приложение готово к развертыванию через Docker. Используйте `docker-compose.yml` для production окружения.
