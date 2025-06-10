import subprocess
import logging

logger = logging.getLogger(__name__)

def process_audiovideo_conversion(input_path, output_path):
    """
    Uses FFmpeg to convert an audio or video file.
    """
    command = [
        'ffmpeg',
        '-i',
        input_path,
        output_path
    ]

    try:
        logger.info(f"FFmpeg komutu çalıştırılıyor: {' '.join(command)}")
        process = subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True
        )
        logger.info(f"FFmpeg çıktısı: {process.stderr}") # FFmpeg progress/info often goes to stderr
        return True, None
    except FileNotFoundError:
        error_message = "FFmpeg bulunamadı. Kurulu olduğundan ve PATH'e eklendiğinden emin olun."
        logger.error(error_message)
        return False, error_message
    except subprocess.CalledProcessError as e:
        error_message = f"FFmpeg hata verdi: {e.stderr}"
        logger.error(error_message)
        return False, error_message
    except Exception as e:
        error_message = f"Ses/video dönüştürme sırasında beklenmedik bir hata oluştu: {str(e)}"
        logger.error(error_message, exc_info=True)
        return False, error_message