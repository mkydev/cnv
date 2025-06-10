# Stage 1: Frontend build
FROM node:lts as frontend

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend .
RUN npm run build

# Stage 2: Backend build
FROM python:3.10-slim

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    poppler-utils \
    imagemagick \
    ffmpeg \
    && sed -i '/<policy domain="coder" rights="none" pattern="PDF" \/>/d' /etc/ImageMagick-6/policy.xml \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy artifacts
COPY backend .
COPY --from=frontend /app/frontend/dist ./static

ENV PORT=8000
EXPOSE $PORT
CMD gunicorn --workers 2 --bind 0.0.0.0:$PORT app:app