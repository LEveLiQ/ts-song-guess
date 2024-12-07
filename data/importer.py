import os
import json
from pathlib import Path

def generate_songs_json():
    songs_dir = Path(os.path.dirname(__file__)) / "songs"
    songs = []
    
    for song_file in songs_dir.glob("*.mp3"):
        default_id = song_file.stem
        default_title = song_file.stem.replace('_', ' ').title()
        file_path = str(song_file.name)
        
        # Always auto-process IDs, only ask for title if multi-word
        if '_' not in song_file.stem:
            songs.append({
                "id": default_id,
                "title": default_title,
                "filePath": file_path
            })
            print(f"\nProcessing: {song_file.name} ({default_id})")
            print(f"Title: {default_title}")
        else:
            print(f"\nProcessing: {song_file.name} ({default_id})")
            custom_title = input(f"Title [{default_title}]: ").strip()
            
            songs.append({
                "id": default_id,
                "title": custom_title if custom_title else default_title,
                "filePath": file_path
            })
    
    songs.sort(key=lambda x: x['title'])
    
    output_path = Path("data") / "songs.json"
    output_path.parent.mkdir(exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump({"songs": songs}, f, indent=2, ensure_ascii=False)
    
    print(f"\nGenerated songs.json with {len(songs)} songs")

generate_songs_json()