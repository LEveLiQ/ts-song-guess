import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import { readFileSync } from 'fs';

if (!ffmpegStatic) {
    throw new Error('ffmpeg-static path is null. Please ensure ffmpeg-static is properly installed.');
}

ffmpeg.setFfmpegPath(ffmpegStatic);

export interface Song {
  id: string;      // filename without extension (e.g., "stronger")
  title: string;   // actual song title (e.g., "Stronger")
  filePath: string;// path to MP3 file relative to data/songs
}

export class SongManager {
  private songs: Song[];
  private readonly songsPath: string;
  private readonly songsDir: string;

  constructor() {
    this.songsPath = path.join(__dirname, '../../data/songs.json');
    this.songsDir = path.join(__dirname, '../../data/songs');
    this.songs = this.loadSongs();
  }

  private loadSongs(): Song[] {
    try {
      const data = readFileSync(this.songsPath, 'utf8');
      const { songs } = JSON.parse(data);
      return songs;
    } catch (error) {
      console.error('Error loading songs:', error);
      return [];
    }
  }

  public getRandomSong(): Song {
    const randomIndex = Math.floor(Math.random() * this.songs.length);
    return this.songs[randomIndex];
  }

  public async createSongSnippet(song: Song): Promise<string> {
    const inputPath = path.join(this.songsDir, song.filePath);
    const outputPath = path.join(this.songsDir, `guess.mp3`);
    
    const startTime = Math.floor(Math.random() * 80) + 20; // Random time between 20-100 seconds

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(2) // 2 second snippet
        .output(outputPath)
        .on('start', (command) => console.log('FFmpeg command:', command))
        .on('end', () => resolve(outputPath))
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .run();
    });
  }

  public getSongById(id: string): Song | undefined {
    return this.songs.find(song => song.id === id);
  }

  public findSongByTitle(title: string): Song | undefined {
    const normalizedTitle = title.toLowerCase().trim();
    return this.songs.find(song => 
        song.title.toLowerCase().trim() === normalizedTitle
    );
  }
}