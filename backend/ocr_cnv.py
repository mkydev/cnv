# ocr_cnv.py
import pytesseract
from PIL import Image
import os
from pdf2image import convert_from_path 


def process_ocr_conversion(input_filepath):
    print(f"OCR (Resim/PDF -> Metin) işlemi başlatılıyor: {input_filepath}")

    file_extension = input_filepath.rsplit('.', 1)[1].lower()
    extracted_text = ""
    success = False
    error_message = None

    try:
        if file_extension in ['jpg', 'jpeg', 'png', 'tiff', 'bmp', 'webp']:
            # Resim dosyası doğrudan işlenir
            extracted_text = pytesseract.image_to_string(Image.open(input_filepath), lang='tur+eng')
            success = True
        elif file_extension == 'pdf':
            # PDF dosyası önce resimlere dönüştürülür, sonra OCR yapılır
            print(f"PDF dönüştürme işlemi başlatılıyor: {input_filepath}")

            # PDF'i sayfa sayfa resimlere dönüştür
            # Bu adımda Poppler'a ihtiyaç duyulur. poppler_path'i kendi sisteminize göre ayarlayın.
            images = convert_from_path(input_filepath, 
                                       dpi=300, # Yüksek DPI daha iyi OCR sonuçları verir
                                       # poppler_path=poppler_path # Eğer Poppler PATH'te değilse belirtin
                                      )

            print(f"{len(images)} Sayfa resme dönüştürüldü. OCR başlatılıyor...")
            # Her bir resim üzerinde OCR yap ve metni birleştir
            for i, img in enumerate(images):
                page_text = pytesseract.image_to_string(img, lang='tur+eng')
                extracted_text += f"\n--- Sayfa {i+1} ---\n" + page_text
            success = True
        else:
            error_message = f"Desteklenmeyen dosya türü: {file_extension}. Sadece resim ve PDF desteklenir."
            success = False

        if success and extracted_text is not None:
            print("OCR başarılı, metin hafızada.")
            return True, extracted_text, None # Success, extracted text, no error
        else:
            if not error_message: # Eğer daha önce bir hata mesajı yoksa
                error_message = "OCR işlemi tamamlandı ancak metin çıkarılamadı veya boş."
            print(error_message)
            return False, None, error_message 

    except pytesseract.TesseractNotFoundError:
        error_message = "Tesseract OCR motoru bulunamadı. Kurulu olduğundan ve PATH'e eklendiğinden emin olun."
        print(error_message)
        return False, None, error_message
    except FileNotFoundError:
        error_message = f"OCR için giriş dosyası bulunamadı: {input_filepath}"
        print(error_message)
        return False, None, error_message
    except Exception as e: # Catch any errors from PIL, PyTesseract, pdf2image
        error_message = f"OCR işlemi sırasında bir hata oluştu: {str(e)}"
        print(f"OCR İşlem Hatası: {e}")
        return False, None, error_message