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

