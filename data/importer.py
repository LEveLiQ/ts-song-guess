import os
import json
from pathlib import Path
from tinytag import TinyTag

def generate_songs_json(songs_dir, output_filename):
    songs_dir = Path(os.path.join("data", songs_dir)).resolve()
    if not songs_dir.exists() or not songs_dir.is_dir():
        print(f"Directory does not exist: {songs_dir}")
        return

    songs = []

    # Use case-insensitive matching for .mp3 files
    for song_file in songs_dir.glob("**/*.mp3"):
        file_path = str(song_file.relative_to(songs_dir)).replace('\\', '/')

        try:
            tag = TinyTag.get(song_file)
            song_id = song_file.stem
            song_title = tag.title
            if song_title is None:
                raise Exception();
                

            songs.append({
                "id": song_id,
                "title": song_title,
                "filePath": file_path
            })

        except Exception as e:
            default_id = song_file.stem
            default_title = song_file.stem.replace('_', ' ').title()
            custom_title = input(f"Title for '{default_id}' ({default_title}): ").strip()

            songs.append({
                "id": default_id,
                "title": custom_title if custom_title else default_title,
                "filePath": file_path
            })

    if not songs:
        print("No MP3 files found.")
        return

    songs.sort(key=lambda x: x['title'])

    output_path = Path(os.path.join(os.getcwd(), output_filename)).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({"songs": songs}, f, indent=2, ensure_ascii=False)

    print(f"Generated {output_filename} with {len(songs)} songs")

songs_dir = input("Enter the directory containing MP3 files: ")
output_filename = input("Enter the desired output JSON filename: ")
generate_songs_json(songs_dir, output_filename)