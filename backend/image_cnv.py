import subprocess
import logging

logger = logging.getLogger(__name__)

def process_image_conversion(input_path, output_path):
    """
    Uses ImageMagick to convert an image file.
    Now uses the 'convert' command for broader compatibility (ImageMagick v6).
    """

    command = [
        'convert',
        input_path,
        output_path
    ]
    
    try:
        logger.info(f"ImageMagick komutu çalıştırılıyor: {' '.join(command)}")
        process = subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True
        )
        logger.info(f"ImageMagick çıktısı: {process.stdout}")
        return True, None
    except FileNotFoundError:
        error_message = "ImageMagick (convert komutu) bulunamadı. Kurulu olduğundan ve PATH'e eklendiğinden emin olun."
        logger.error(error_message)
        return False, error_message
    except subprocess.CalledProcessError as e:
        error_message = f"ImageMagick hata verdi: {e.stderr}"
        logger.error(error_message)
        return False, error_message
    except Exception as e:
        error_message = f"Resim dönüştürme sırasında beklenmedik bir hata oluştu: {str(e)}"
        logger.error(error_message, exc_info=True)
        return False, error_message