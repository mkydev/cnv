import os

# Koyeb'in geçici dosya sistemi için /tmp kullan
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', os.path.join('/tmp', 'temp_files'))

# Dizin oluştur, var olan dizin için hata verme
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
print(f"Using UPLOAD_FOLDER at {UPLOAD_FOLDER}")