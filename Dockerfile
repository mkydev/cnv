# Python'un slim versiyonunu temel alıyoruz
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

# Proje dosyaları için bir çalışma dizini oluşturuyoruz
WORKDIR /app

# Önce backend bağımlılıklarını kopyalayıp kuruyoruz
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Frontend build'i için Node.js'i kuruyoruz
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
RUN apt-get install -y --no-install-recommends nodejs

# Frontend bağımlılıklarını kopyalayıp kuruyoruz
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm install

# Projenin geri kalan tüm kodlarını kopyalıyoruz
COPY . .

# Frontend uygulamasını build ediyoruz
RUN cd frontend && npm run build

# Koyeb'in dış dünyaya açacağı port'u belirtiyoruz
EXPOSE 8000

# Uygulamayı Gunicorn ile production modunda başlatıyoruz
# Koyeb $PORT değişkenini otomatik sağlar. --chdir ile backend klasörüne geçeriz.
CMD gunicorn --workers 4 --bind 0.0.0.0:$PORT --chdir backend app:app