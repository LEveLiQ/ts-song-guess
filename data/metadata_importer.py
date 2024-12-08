import os
import json
from tinytag import TinyTag

def get_songs_metadata_recursive(folder_path):
    """
    Parses a folder and its subfolders for MP3 files, extracts metadata,
    and returns a JSON string.

    Args:
        folder_path: The path to the root folder.

    Returns:
        A JSON string with the specified format, or None if an error occurs.
    """
    songs_data = {"songs": []}
    try:
        for root, _, files in os.walk(folder_path):
            for filename in files:
                if filename.endswith(".mp3"):
                    file_path = os.path.join(root, filename)
                    relative_path = os.path.relpath(file_path, folder_path)
                    try:
                        tag = TinyTag.get(file_path)
                        songs_data["songs"].append({
                            "id": os.path.splitext(filename)[0],
                            "title": tag.title if tag.title else os.path.splitext(filename)[0],
                            "filePath": relative_path 
                        })
                    except Exception as e:
                        print(f"Error processing {filename}: {e}")
    except FileNotFoundError:
        print(f"Error: Folder not found: {folder_path}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None

    return json.dumps(songs_data, indent=2)

folder_path = "songs"
json_output = get_songs_metadata_recursive(folder_path)

if json_output:
    print(json_output)

    with open("songs.json", "w") as f:
        f.write(json_output)