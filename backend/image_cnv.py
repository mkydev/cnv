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
    command = ['convert', input_filepath, output_filepath] #
    print(f"ImageMagick komutu çalıştırılıyor: {' '.join(command)}") #
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True) #
        print("ImageMagick çıktısı (stdout):", result.stdout) #
        print("ImageMagick çıktısı (stderr):", result.stderr) #
        if os.path.exists(output_filepath):
            return True, None # Success
        else:
            return False, "ImageMagick işlemi tamamlandı ancak çıktı dosyası oluşturulmadı."
    except FileNotFoundError:
        error_msg = "ImageMagick (convert komutu) bulunamadı. Kurulu olduğundan ve PATH'e eklendiğinden emin olun." #
        print(error_msg)
        return False, error_msg
    except subprocess.CalledProcessError as e:
        error_detail = e.stderr.strip() if e.stderr else e.stdout.strip() if e.stdout else 'Bilinmeyen bir ImageMagick hatası' #
        error_msg = f"ImageMagick çalışırken hata oluştu: {error_detail}" #
        print(f"ImageMagick Subprocess Hatası (Stderr): {e.stderr}") #
        print(f"ImageMagick Subprocess Hatası (Stdout): {e.stdout}") #
        return False, error_msg
    except Exception as e:
        error_msg = f"ImageMagick dönüşümü sırasında beklenmedik bir hata oluştu: {str(e)}" #
        print(f"ImageMagick Genel Hata: {e}")
        return False, error_msg