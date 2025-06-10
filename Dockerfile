FROM python:3.10-slim

# Tesseract, Poppler, Curl, ImageMagick ve FFmpeg'i kuruyoruz.
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    poppler-utils \
    curl \
    imagemagick \
    ffmpeg \
    && find /etc/ImageMagick* -name "policy.xml" -exec sed -i 's/<policy domain=.*rights=.*pattern=.*>//g' {} + \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
RUN apt-get install -y --no-install-recommends nodejs

COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm install

COPY . .

RUN cd frontend && npm run build

EXPOSE 10000

CMD gunicorn --workers 4 --bind 0.0.0.0:$PORT --chdir backend app:app