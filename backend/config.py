import os

# Define the upload folder, one level above the current file's directory (i.e., project_root/temp_files)
# This assumes config.py is in the 'backend' directory.
UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'temp_files'))

# Ensure the upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
    print(f"Created UPLOAD_FOLDER at {UPLOAD_FOLDER}") # Using print here as logger might not be set up when this module is imported. 