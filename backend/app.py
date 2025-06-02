from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import uuid
import shutil

# Conversion manager'ı import ediyoruz
from conversion_manager import handle_conversion_request # BU SATIR KALSIN

# Flask uygulamasını başlatıyoruz
app = Flask(__name__)

# CORS'u etkinleştiriyoruz
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'temp_files') 

# Eğer yükleme klasörü yoksa oluştur
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Ana sayfa rotası
@app.route('/')
def index():
    return "Dosya Dönüştürme Backend Çalışıyor! (Bölünmüş Yapı)"

# Dönüştürme işlemini yönetecek ana rota
@app.route('/convert', methods=['POST'])
def convert_file():
    print("'/convert' rotasına POST isteği geldi.")

    if 'file' not in request.files:
        print("Hata: İstekte 'file' kısmı yok.")
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    target_format = request.form.get('target_format')

    if file.filename == '':
        print("Hata: Dosya seçilmemiş.")
        return jsonify({"error": "No selected file"}), 400

    if not target_format:
         print("Hata: Hedef format belirtilmemiş.")
         return jsonify({"error": "No target format specified"}), 400

    print(f"Yüklenen dosya: {file.filename}, Hedef format: {target_format}")

    original_filename = file.filename
    if '.' not in original_filename:
        print(f"Hata: Dosyanın uzantısı yok: {original_filename}")
        return jsonify({"error": "File has no extension"}), 400
    file_extension = original_filename.rsplit('.', 1)[1].lower()

    unique_id = str(uuid.uuid4())
    input_filename = f"{unique_id}_input.{file_extension}"
    input_filepath = os.path.join(UPLOAD_FOLDER, input_filename)

    try:
        file.save(input_filepath)
        print(f"Dosya kaydedildi: {input_filepath}")
    except Exception as e:
        print(f"Dosya kaydetme hatası: {e}")
        return jsonify({"error": f"Failed to save file: {e}"}), 500

    # --- Dönüştürme işlemini conversion_manager'a devret ---
    conversion_successful, result_data, error_message = handle_conversion_request(
        input_filepath, file_extension, target_format, UPLOAD_FOLDER, unique_id
    )

    # Giriş dosyasını temizle (her zaman)
    if os.path.exists(input_filepath):
        try:
            os.remove(input_filepath)
            print(f"Giriş dosyası silindi: {input_filepath}")
        except Exception as e:
            print(f"Giriş dosyası silinirken hata oluştu: {e}")

    # Yanıtı gönder
    if conversion_successful:
        if target_format == 'txt' and result_data is not None: # result_data here is text_content for OCR
            print("OCR dönüşümü başarılı, metin içeriği JSON olarak gönderiliyor.")
            return jsonify({"success": True, "text_content": result_data})
        elif result_data and isinstance(result_data, str): # result_data is output_filename for file downloads
            # Check if the output file actually exists on disk before returning success
            output_filepath_to_check = os.path.join(UPLOAD_FOLDER, result_data)
            if os.path.exists(output_filepath_to_check):
                print(f"Dosya dönüşümü başarılı ({target_format}), çıktı dosya adı gönderiliyor: {result_data}")
                return jsonify({"success": True, "output_filename": result_data})
            else:
                error_message_final = error_message or "Dönüşüm başarılı görünüyor ama çıktı dosyası bulunamadı."
                return jsonify({"success": False, "error": error_message_final}), 500
        else:
            final_error_message = error_message or "Dönüşüm başarılı görünüyor ama çıktı bilgisi eksik."
            print(final_error_message)
            return jsonify({"success": False, "error": final_error_message}), 500
    else:
        print(f"Dönüşüm başarısız oldu. Hata: {error_message}")
        
        # Dönüşüm başarısızsa ve bir çıktı dosyası oluşturulmuşsa, onu da temizle
        # output_filename'in olması halinde temizlik yaparız
        if output_filename and target_format != 'txt': # txt formatında dosya çıkmıyor
            output_filepath_to_clean = os.path.join(UPLOAD_FOLDER, output_filename)
            if os.path.exists(output_filepath_to_clean):
                try:
                    os.remove(output_filepath_to_clean)
                    print(f"Başarısız dönüşüm sonrası çıktı dosyası silindi: {output_filepath_to_clean}")
                except Exception as e:
                    print(f"Başarısız dönüşüm sonrası çıktı dosyası silinirken hata: {e}")

        final_error_message = error_message or "Dönüştürme başarısız oldu ve bir hata mesajı alınamadı."
        return jsonify({"success": False, "error": final_error_message}), 500


@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    print(f"'/download/{filename}' rotasına GET isteği geldi.")
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    try:
        # Güvenlik: İndirilen dosyanın sadece UPLOAD_FOLDER içinde olduğundan emin olun
        real_filepath = os.path.realpath(filepath)
        if not real_filepath.startswith(os.path.realpath(UPLOAD_FOLDER)):
            print(f"Güvenlik hatası: İstenen dosya yükleme klasöründe değil: {filepath}")
            return jsonify({"error": "Invalid file request"}), 403
    except Exception as e:
        print(f"Güvenlik kontrolü sırasında hata: {e}")
        return jsonify({"error": "Güvenlik kontrol hatası"}), 500

    if os.path.exists(filepath):
        print(f"Dosya bulundu, gönderiliyor: {filepath}")
        return send_file(filepath, as_attachment=True)
    else:
        print(f"Hata: Dosya bulunamadı: {filepath}")
        return jsonify({"error": "File not found."}), 404

if __name__ == '__main__':
    print("Flask sunucusu başlatılıyor...")
    app.run(debug=True, port=5001, host='127.0.0.1')