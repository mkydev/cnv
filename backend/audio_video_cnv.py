import subprocess
import os

def process_audiovideo_conversion(input_filepath, output_filepath):
    """
    Converts an audio/video file to another format (e.g., MP3) using FFmpeg.
    Args:
        input_filepath (str): Path to the input audio/video file.
        output_filepath (str): Path to save the converted file.
    Returns:
        tuple: (bool: success, str: error_message or None)
    """
    command = ['ffmpeg', '-i', input_filepath, output_filepath] #
    print(f"FFmpeg komutu çalıştırılıyor: {' '.join(command)}") #
    try:
        # Note: shell=True was removed for security. If ffmpeg fails for complex paths/options, 
        # review if it's absolutely necessary and understand the risks.
        # For simple input/output, it's usually not required.
        result = subprocess.run(command, check=True, capture_output=True, text=True) #
        print("FFmpeg çıktısı (stdout):", result.stdout) #
        print("FFmpeg çıktısı (stderr):", result.stderr) #
        if os.path.exists(output_filepath):
            return True, None # Success
        else:
            return False, "FFmpeg işlemi tamamlandı ancak çıktı dosyası oluşturulmadı."
    except FileNotFoundError:
        error_msg = "FFmpeg bulunamadı. Kurulu olduğundan ve PATH'e eklendiğinden emin olun." #
        print(error_msg)
        return False, error_msg
    except subprocess.CalledProcessError as e:
        error_detail = e.stderr.strip() if e.stderr else e.stdout.strip() if e.stdout else 'Bilinmeyen bir FFmpeg hatası' #
        error_msg = f"FFmpeg çalışırken hata oluştu: {error_detail}" #
        print(f"FFmpeg Subprocess Hatası (Stderr): {e.stderr}") #
        print(f"FFmpeg Subprocess Hatası (Stdout): {e.stdout}") #
        return False, error_msg
    except Exception as e:
        error_msg = f"FFmpeg dönüşümü sırasında beklenmedik bir hata oluştu: {str(e)}" #
        print(f"FFmpeg Genel Hata: {e}")
        return False, error_msg