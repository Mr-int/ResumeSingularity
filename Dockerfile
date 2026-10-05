# Многоступенчатая сборка для React/Vite приложения
# Vite 7 требует Node.js 20.19+ или 22.12+

# Этап 1: Сборка приложения
FROM node:22-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production=false

# Копируем весь код
COPY . .

# `/` — основной сайт, `/plt/` — тестовый контур за тем же доменом.
# Пустой VITE_API_BASE_URL: API берётся от префикса (`/api/v1/` или `/plt/api/v1/`).
ARG VITE_BASE_PATH=/
ARG VITE_API_BASE_URL=/
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Собираем приложение для production
RUN npm run build

# Этап 2: Production образ с nginx
FROM nginx:1.25-alpine

# Копируем собранное приложение из builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80
EXPOSE 80

# Nginx запускается автоматически
CMD ["nginx", "-g", "daemon off;"]

