# Python'un slim versiyonunu temel alıyoruz
FROM python:3.10-slim


RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Proje dosyaları için bir çalışma dizini oluşturuyoruz
WORKDIR /app

# Önce backend bağımlılıklarını kopyalayıp kuruyoruz ki her kod değişikliğinde tekrar kurulmasın
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Frontend build'i için Node.js'i kuruyoruz
# Artık 'curl' yüklü olduğu için bu adım başarılı olacaktır.
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
RUN apt-get install -y nodejs

# Frontend bağımlılıklarını kopyalayıp kuruyoruz
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm install

# Projenin geri kalan tüm kodlarını kopyalıyoruz
COPY . .

# Frontend uygulamasını build ediyoruz
RUN cd frontend && npm run build

# Render'ın dış dünyaya açacağı port'u belirtiyoruz
EXPOSE 10000

# Backend uygulamasını başlatıyoruz
CMD ["gunicorn", "--workers", "4", "--bind", "0.0.0.0:${PORT}", "--chdir", "backend", "app:app"]