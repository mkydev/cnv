from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import uuid
import shutil
import logging

# Import configuration
from config import UPLOAD_FOLDER # New import

# Conversion manager'ı import ediyoruz
from conversion_manager import handle_conversion_request # BU SATIR KALSIN

# Flask uygulamasını başlatıyoruz
app = Flask(__name__)

# Configure logging - New
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
app.logger.handlers.clear() # Flask's default handler can be verbose or go to stderr
for handler in logging.getLogger().handlers: # Use root logger's handlers
    app.logger.addHandler(handler)
app.logger.propagate = False # Avoid duplicate logs if root logger also has handlers

# CORS'u etkinleştiriyoruz
CORS(app)

# UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'temp_files') # Old definition - REMOVE
# if not os.path.exists(UPLOAD_FOLDER): # Old check - REMOVE
# os.makedirs(UPLOAD_FOLDER) # Old creation - REMOVE

# Ana sayfa rotası
@app.route('/')
def index():
    app.logger.info("Root path '/' accessed.")
    return "Dosya Dönüştürme Backend Çalışıyor! (Bölünmüş Yapı)"

# Dönüştürme işlemini yönetecek ana rota
@app.route('/convert', methods=['POST'])
def convert_file():
    app.logger.info("'/convert' rotasına POST isteği geldi.")

    if 'file' not in request.files:
        app.logger.warning("Hata: İstekte 'file' kısmı yok.")
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    target_format = request.form.get('target_format')

    if file.filename == '':
        app.logger.warning("Hata: Dosya seçilmemiş.")
        return jsonify({"error": "No selected file"}), 400

    if not target_format:
         app.logger.warning("Hata: Hedef format belirtilmemiş.")
         return jsonify({"error": "No target format specified"}), 400

    app.logger.info(f"Yüklenen dosya: {file.filename}, Hedef format: {target_format}")

    original_filename = file.filename
    if '.' not in original_filename:
        app.logger.warning(f"Hata: Dosyanın uzantısı yok: {original_filename}")
        return jsonify({"error": "File has no extension"}), 400
    file_extension = original_filename.rsplit('.', 1)[1].lower()

    unique_id = str(uuid.uuid4())
    input_filename = f"{unique_id}_input.{file_extension}"
    input_filepath = os.path.join(UPLOAD_FOLDER, input_filename)

    try:
        file.save(input_filepath)
        app.logger.info(f"Dosya kaydedildi: {input_filepath}")
    except Exception as e:
        app.logger.error(f"Dosya kaydetme hatası: {e}", exc_info=True)
        return jsonify({"error": f"Failed to save file: {e}"}), 500

    # --- Dönüştürme işlemini conversion_manager'a devret ---
    conversion_successful, result_data, error_message = handle_conversion_request(
        input_filepath, file_extension, target_format, UPLOAD_FOLDER, unique_id
    )

    # Giriş dosyasını temizle (her zaman)
    if os.path.exists(input_filepath):
        try:
            os.remove(input_filepath)
            app.logger.info(f"Giriş dosyası silindi: {input_filepath}")
        except Exception as e:
            app.logger.error(f"Giriş dosyası silinirken hata oluştu: {e}", exc_info=True)

    # Yanıtı gönder
    if conversion_successful:
        if target_format == 'txt' and result_data is not None: # result_data here is text_content for OCR
            app.logger.info("OCR dönüşümü başarılı, metin içeriği JSON olarak gönderiliyor.")
            return jsonify({"success": True, "text_content": result_data})
        elif result_data and isinstance(result_data, str): # result_data is output_filename for file downloads
            # The conversion_manager already confirmed the file exists if it returned success and a filename.
            app.logger.info(f"Dosya dönüşümü başarılı ({target_format}), çıktı dosya adı gönderiliyor: {result_data}")
            return jsonify({"success": True, "output_filename": result_data})
        else:
            # This case implies conversion_successful was True, but result_data was neither text (for OCR) nor a string (filename).
            # This could happen if conversion_manager has a logic flaw for a successful conversion.
            final_error_message = error_message or "Dönüşüm başarılı görünüyor ama beklenmedik bir çıktı verisi alındı."
            app.logger.error(f"Conversion successful according to manager, but result_data is unexpected. Data: {result_data}, Error: {error_message}")
            return jsonify({"success": False, "error": final_error_message}), 500
    else:
        app.logger.error(f"Dönüşüm başarısız oldu. Hata: {error_message}")
        
        # Dönüşüm başarısızsa ve bir çıktı dosyası oluşturulmuşsa, onu da temizle
        # output_filename'in olması halinde temizlik yaparız
        # The variable 'output_filename' is not defined in this scope if conversion_successful is False and result_data was None.
        # This was a bug in the original code.
        # We should try to construct a potential output filename to clean if possible, or rely on conversion_manager to have cleaned it.
        # For now, let's log this potential issue and keep similar logic.
        # A better fix would involve conversion_manager returning the attempted output_filename even on failure if applicable.
        potential_output_filename = f"{unique_id}_output.{target_format}" # Try to guess
        if target_format != 'txt': # txt formatında dosya çıkmıyor
            output_filepath_to_clean = os.path.join(UPLOAD_FOLDER, potential_output_filename)
            if os.path.exists(output_filepath_to_clean):
                try:
                    os.remove(output_filepath_to_clean)
                    app.logger.info(f"Başarısız dönüşüm sonrası potansiyel çıktı dosyası silindi: {output_filepath_to_clean}")
                except Exception as e:
                    app.logger.error(f"Başarısız dönüşüm sonrası çıktı dosyası silinirken hata: {e}", exc_info=True)

        final_error_message = error_message or "Dönüştürme başarısız oldu ve bir hata mesajı alınamadı."
        return jsonify({"success": False, "error": final_error_message}), 500


@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    app.logger.info(f"'/download/{filename}' rotasına GET isteği geldi.")
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    try:
        # Güvenlik: İndirilen dosyanın sadece UPLOAD_FOLDER içinde olduğundan emin olun
        real_filepath = os.path.realpath(filepath)
        if not real_filepath.startswith(os.path.realpath(UPLOAD_FOLDER)):
            app.logger.warning(f"Güvenlik hatası: İstenen dosya yükleme klasöründe değil: {filepath}")
            return jsonify({"error": "Invalid file request"}), 403
    except Exception as e:
        app.logger.error(f"Güvenlik kontrolü sırasında hata: {e}", exc_info=True)
        return jsonify({"error": "Güvenlik kontrolü hatası"}), 500

    if os.path.exists(filepath):
        app.logger.info(f"Dosya bulundu, gönderiliyor: {filepath}")
        return send_file(filepath, as_attachment=True)
    else:
        app.logger.error(f"Hata: Dosya bulunamadı: {filepath}")
        return jsonify({"error": "File not found."}), 404

if __name__ == '__main__':
    app.logger.info("Flask sunucusu başlatılıyor...")
    app.run(debug=True, port=5001, host='127.0.0.1')