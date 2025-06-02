# conversion_manager.py
from image_cnv import process_image_conversion
from audio_video_cnv import process_audiovideo_conversion
from ocr_cnv import process_ocr_conversion
from pdf_cnv import convert_pdf_to_docx

import os

def handle_conversion_request(input_filepath, file_extension, target_format, UPLOAD_FOLDER, unique_id):
    """
    Determines which conversion process to call based on file type and target format.
    Args:
        input_filepath (str): Path to the input file.
        file_extension (str): Original file extension.
        target_format (str): Desired output format.
        UPLOAD_FOLDER (str): Base path for temporary files.
        unique_id (str): Unique identifier for the current request.
    Returns:
        tuple: (bool: conversion_successful, any: result_data (text_content or output_filename), str: error_message)
    """
    conversion_successful = False
    error_message = ""
    output_filename = None
    output_filepath = None
    extracted_text_content = None

    if target_format != 'txt':
        output_filename = f"{unique_id}_output.{target_format}"
        output_filepath = os.path.join(UPLOAD_FOLDER, output_filename)
        print(f"Çıkış dosyası yolu belirlendi: {output_filepath}")
    else: # For OCR, output_filename is for logical consistency if we were to save it
        output_filename = f"{unique_id}_output.txt"

    print(f"Dönüştürme işlemine başlanıyor: {file_extension.upper()} -> {target_format.upper()}")

    try:
        # ÖNCELİKLE OCR İŞLEMİNİ KONTROL EDELİM (PDF'ten TXT'ye veya Resimden TXT'ye)
        if (file_extension in ['pdf', 'jpg', 'jpeg', 'png', 'tiff', 'bmp', 'webp']) and target_format == 'txt':
            # OCR (PDF/Image -> Text)
            conversion_successful, extracted_text_content, error_message = process_ocr_conversion(input_filepath)
            # OCR metin döndürdüğü için dosya yolu gerekmez, extracted_text_content'ı kullanacağız
            # Başarılı olduğunda burada başka bir çıktı dosyası oluşmaz, sadece metin döner.
            
        elif file_extension == 'pdf' and target_format in ['docx']:
            conversion_successful, error_message = convert_pdf_to_docx(input_filepath, output_filepath)

        elif file_extension in ['jpg', 'jpeg', 'png', 'webp', 'gif'] and target_format in ['pdf', 'png', 'jpg', 'webp', 'gif']:
            # Image Conversions (e.g., ImageMagick)
            conversion_successful, error_message = process_image_conversion(input_filepath, output_filepath)

        elif file_extension in ['mp4', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'webm', 'ogg', 'wav', 'aac', 'flac'] and target_format in ['mp3', 'mp4', 'avi', 'mov']:
            # Audio/Video Conversions (e.g., FFmpeg)
            conversion_successful, error_message = process_audiovideo_conversion(input_filepath, output_filepath)
            
        else:
            error_message = f"Dönüştürme formatı desteklenmiyor: {file_extension.upper()} -> {target_format.upper()}"
            print(error_message)
            conversion_successful = False

    except Exception as e:
        error_message = f"Dönüştürme sırasında beklenmedik bir genel hata oluştu: {str(e)}"
        print(f"Genel Dönüşüm Hatası: {e}")
        conversion_successful = False

    # Decide what to return based on success and target format
    if conversion_successful:
        if target_format == 'txt':
            return True, extracted_text_content, None # Return text content for OCR
        elif output_filename and os.path.exists(output_filepath):
            return True, output_filename, None # Return filename for file downloads
        else:
            # Should ideally not be reached if logic is correct
            error_message = error_message or f"Dönüşüm başarılı görünüyor ama çıktı bilgisi eksik ({'metin yok' if target_format == 'txt' else output_filename + ' bulunamadı'})."
            return False, None, error_message
    else:
        return False, None, error_message# conversion_manager.py
from image_cnv import process_image_conversion
from audio_video_cnv import process_audiovideo_conversion
from ocr_cnv import process_ocr_conversion
from pdf_cnv import convert_pdf_to_docx # YENİ EKLENDİ

import os

def handle_conversion_request(input_filepath, file_extension, target_format, UPLOAD_FOLDER, unique_id):
    """
    Determines which conversion process to call based on file type and target format.
    Args:
        input_filepath (str): Path to the input file.
        file_extension (str): Original file extension.
        target_format (str): Desired output format.
        UPLOAD_FOLDER (str): Base path for temporary files.
        unique_id (str): Unique identifier for the current request.
    Returns:
        tuple: (bool: conversion_successful, any: result_data (text_content or output_filename), str: error_message)
    """
    conversion_successful = False
    error_message = ""
    output_filename = None
    output_filepath = None
    extracted_text_content = None

    if target_format != 'txt':
        output_filename = f"{unique_id}_output.{target_format}"
        output_filepath = os.path.join(UPLOAD_FOLDER, output_filename)
        print(f"Çıkış dosyası yolu belirlendi: {output_filepath}")
    else: # For OCR, output_filename is for logical consistency if we were to save it
        output_filename = f"{unique_id}_output.txt"

    print(f"Dönüştürme işlemine başlanıyor: {file_extension.upper()} -> {target_format.upper()}")

    try:
        # ÖNCELİKLE OCR İŞLEMİNİ KONTROL EDELİM (PDF'ten TXT'ye veya Resimden TXT'ye)
        if (file_extension in ['pdf', 'jpg', 'jpeg', 'png', 'tiff', 'bmp', 'webp']) and target_format == 'txt':
            # OCR (PDF/Image -> Text)
            conversion_successful, extracted_text_content, error_message = process_ocr_conversion(input_filepath)
            # OCR metin döndürdüğü için dosya yolu gerekmez, extracted_text_content'ı kullanacağız
            # Başarılı olduğunda burada başka bir çıktı dosyası oluşmaz, sadece metin döner.
            
        # PDF'TEN DOCX'E DÖNÜŞÜM İÇİN YENİ BLOK
        elif file_extension == 'pdf' and target_format == 'docx':
            conversion_successful, error_message = convert_pdf_to_docx(input_filepath, output_filepath)

        elif file_extension in ['jpg', 'jpeg', 'png', 'webp', 'gif'] and target_format in ['pdf', 'png', 'jpg', 'webp', 'gif']:
            # Image Conversions (e.g., ImageMagick)
            conversion_successful, error_message = process_image_conversion(input_filepath, output_filepath)

        elif file_extension in ['mp4', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'webm', 'ogg', 'wav', 'aac', 'flac'] and target_format in ['mp3', 'mp4', 'avi', 'mov']:
            # Audio/Video Conversions (e.g., FFmpeg)
            conversion_successful, error_message = process_audiovideo_conversion(input_filepath, output_filepath)
            
        else:
            error_message = f"Dönüştürme formatı desteklenmiyor: {file_extension.upper()} -> {target_format.upper()}"
            print(error_message)
            conversion_successful = False

    except Exception as e:
        error_message = f"Dönüştürme sırasında beklenmedik bir genel hata oluştu: {str(e)}"
        print(f"Genel Dönüşüm Hatası: {e}")
        conversion_successful = False

    # Decide what to return based on success and target format
    if conversion_successful:
        if target_format == 'txt':
            return True, extracted_text_content, None # Return text content for OCR
        elif output_filename and os.path.exists(output_filepath):
            return True, output_filename, None # Return filename for file downloads
        else:
            # Should ideally not be reached if logic is correct
            error_message = error_message or f"Dönüşüm başarılı görünüyor ama çıktı bilgisi eksik ({'metin yok' if target_format == 'txt' else output_filename + ' bulunamadı'})."
            return False, None, error_message
    else:
        return False, None, error_message