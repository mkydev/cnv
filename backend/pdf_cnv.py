import os
from pdf2docx import Converter

def convert_pdf_to_docx(input_filepath, output_filepath):
    """
    Converts a PDF file to a DOCX (Microsoft Word) file.
    Args:
        input_filepath (str): Path to the input PDF file.
        output_filepath (str): Path to save the converted DOCX file.
    Returns:
        tuple: (bool: success, str: error_message or None)
    """
    print(f"PDF'ten DOCX'e dönüştürme başlatılıyor: {input_filepath} -> {output_filepath}")
    try:
        cv = Converter(input_filepath)
        cv.convert(output_filepath, start=0, end=None) # Tüm sayfaları dönüştür
        cv.close()

        if os.path.exists(output_filepath):
            print("PDF'ten DOCX'e dönüştürme başarılı.")
            return True, None
        else:
            error_msg = "PDF'ten DOCX'e dönüştürme tamamlandı ancak çıktı dosyası oluşturulamadı."
            print(error_msg)
            return False, error_msg

    except Exception as e:
        error_msg = f"PDF'ten DOCX'e dönüştürme sırasında bir hata oluştu: {str(e)}"
        print(error_msg)
        return False, error_msg

# Buraya gelecekte başka PDF işlemleri eklenebilir (örneğin, PDF birleştirme/ayırma)