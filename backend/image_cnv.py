import subprocess
import os

def process_image_conversion(input_filepath, output_filepath):
    """
    Converts an image file to another image format using ImageMagick.
    Args:
        input_filepath (str): Path to the input image file.
        output_filepath (str): Path to save the converted image file.
    Returns:
        tuple: (bool: success, str: error_message or None)
    """
    # ImageMagick v7+ için 'magick' komutunu kullanın.
    # Eğer sisteminizde eski bir ImageMagick varsa veya 'magick' komutu PATH'te değilse,
    # bu satırı ['convert', input_filepath, output_filepath] olarak değiştirebilirsiniz
    # veya ['magick', 'convert', input_filepath, output_filepath] deneyebilirsiniz.
    command = ['magick', input_filepath, output_filepath]
    
    print(f"ImageMagick komutu çalıştırılıyor: {' '.join(command)}")
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True, timeout=60) # Timeout eklendi
        
        # stdout genellikle boştur veya bilgilendirme mesajları içerir.
        if result.stdout:
            print("ImageMagick çıktısı (stdout):", result.stdout)
        # stderr uyarıları (deprecated komut gibi) veya hataları içerebilir.
        if result.stderr:
            print("ImageMagick çıktısı (stderr):", result.stderr)

        # Dosyanın varlığını ve boyutunun sıfırdan büyük olup olmadığını kontrol et
        if os.path.exists(output_filepath) and os.path.getsize(output_filepath) > 0:
            return True, None # Başarılı
        elif os.path.exists(output_filepath):
            # Dosya var ama boyutu sıfır, bu bir sorun.
            error_msg = "ImageMagick işlemi tamamlandı ancak oluşturulan çıktı dosyası boş."
            print(error_msg)
            return False, error_msg
        else:
            # Dosya hiç oluşturulmadı.
            error_msg = "ImageMagick işlemi tamamlandı ancak çıktı dosyası oluşturulmadı."
            print(error_msg)
            return False, error_msg
            
    except FileNotFoundError:
        error_msg = "ImageMagick (magick komutu) bulunamadı. Kurulu olduğundan ve PATH'e eklendiğinden emin olun."
        print(error_msg)
        return False, error_msg
    except subprocess.TimeoutExpired:
        error_msg = f"ImageMagick dönüşümü zaman aşımına uğradı ({command})"
        print(error_msg)
        # Zaman aşımı sonrası kısmi dosya oluşmuş olabilir, temizlemeye çalışmak iyi bir pratik olabilir.
        if os.path.exists(output_filepath):
            try:
                os.remove(output_filepath)
                print(f"Zaman aşımı sonrası kısmi çıktı dosyası silindi: {output_filepath}")
            except Exception as e_remove:
                print(f"Zaman aşımı sonrası kısmi çıktı dosyası silinirken hata: {e_remove}")
        return False, error_msg
    except subprocess.CalledProcessError as e:
        # check=True olduğu için, komut sıfır olmayan bir kodla biterse bu hata tetiklenir.
        error_detail = e.stderr.strip() if e.stderr else e.stdout.strip() if e.stdout else 'Bilinmeyen bir ImageMagick hatası'
        error_msg = f"ImageMagick çalışırken hata oluştu (returncode {e.returncode}): {error_detail}"
        print(f"ImageMagick Subprocess Hatası (Stderr): {e.stderr}")
        print(f"ImageMagick Subprocess Hatası (Stdout): {e.stdout}")
        return False, error_msg
    except Exception as e:
        error_msg = f"ImageMagick dönüşümü sırasında beklenmedik bir genel hata oluştu: {str(e)}"
        print(f"ImageMagick Genel Hata: {e}")
        return False, error_msg