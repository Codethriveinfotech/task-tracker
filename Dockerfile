# Stage 1: Build the React frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Set production backend endpoint to relative path /api
ENV VITE_APPS_SCRIPT_URL=/api
RUN npm run build

# Stage 2: Setup Node Express backend with built static files
FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN npm install --prefix backend
COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "backend/server.js"]
