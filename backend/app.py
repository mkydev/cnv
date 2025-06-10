from flask import Flask, request, jsonify, send_from_directory, send_file, after_this_request
from flask_cors import CORS
import os
import uuid
import json
import logging
import shutil

# Diğer Python dosyalarından ilgili fonksiyonları import ediyoruz
from config import UPLOAD_FOLDER
from conversion_manager import handle_conversion_request

# --- Flask Uygulama Yapılandırması ---
# static_folder: React'in build edilmiş dosyalarının konumu (frontend/dist)
# Bu ayar, CSS ve JS dosyalarının yüklenebilmesi ve sitenin görünmesi için kritiktir.
app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
CORS(app)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- API Rotaları ---

@app.route('/convert', methods=['POST'])
def convert_file_route():
    app.logger.info("'/convert' rotasına tekli dosya isteği geldi.")
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file part in the request"}), 400

    file = request.files['file']
    target_format = request.form.get('target_format')

    if not file or not file.filename:
        return jsonify({"success": False, "error": "No selected file"}), 400
    if not target_format:
        return jsonify({"success": False, "error": "No target format specified"}), 400

    original_filename = file.filename
    if '.' not in original_filename:
        return jsonify({"success": False, "error": "File has no extension"}), 400

    file_extension = original_filename.rsplit('.', 1)[1].lower()
    unique_id = str(uuid.uuid4())
    input_filename = f"{unique_id}_input.{file_extension}"
    input_filepath = os.path.join(UPLOAD_FOLDER, input_filename)
    
    try:
        file.save(input_filepath)
        app.logger.info(f"Dosya kaydedildi: {input_filepath}")

        conversion_successful, result_data, error_message = handle_conversion_request(
            input_filepath, file_extension, target_format, UPLOAD_FOLDER, unique_id
        )

        if conversion_successful:
            return jsonify({
                "success": True,
                "output_filename": result_data if target_format != 'txt' else None,
                "text_content": result_data if target_format == 'txt' else None
            })
        else:
            return jsonify({"success": False, "error": error_message})

    except Exception as e:
        app.logger.error(f"'{original_filename}' işlenirken hata oluştu: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        if os.path.exists(input_filepath):
            os.remove(input_filepath)

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.normpath(filepath).startswith(os.path.normpath(UPLOAD_FOLDER)):
        return jsonify({"error": "Invalid file path"}), 403

    if os.path.exists(filepath):
        @after_this_request
        def remove_file(response):
            try:
                if os.path.exists(filepath):
                    os.remove(filepath)
            except Exception as e:
                app.logger.error(f"İndirilen dosya silinirken hata: {e}", exc_info=True)
            return response
        return send_file(filepath, as_attachment=True)
    else:
        return jsonify({"error": "File not found"}), 404

# --- Statik Dosya Sunucu Rotaları ---
# Bu olmazsa 404 Not Found hatası alırsınız.
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')