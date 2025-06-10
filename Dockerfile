# Stage 1: Build frontend
FROM node:lts as frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --silent

COPY frontend .
RUN npm run build

# Stage 2: Build backend
FROM python:3.10-slim

# Install system dependencies (OCR, ImageMagick, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    poppler-utils \
    curl \
    imagemagick \
    ffmpeg \
    && find /etc/ImageMagick* -name "policy.xml" -exec sed -i 's/<policy domain=.*rights=.*pattern=.*>//g' {} + \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy backend source code
COPY backend .

# Set environment variables
ENV PORT=10000
EXPOSE $PORT

# Run Gunicorn
CMD ["gunicorn", "--workers", "4", "--bind", "0.0.0.0:$PORT", "app:app"]