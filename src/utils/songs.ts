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
    const outputPath = path.join(this.songsDir, `guess.mp4`);
    
    const startTime = Math.floor(Math.random() * 80) + 20; // Random time between 20-100 seconds

    return new Promise((resolve, reject) => {
      ffmpeg()
        // First input - black video
        .input('color=c=black:s=256x256:d=2')
        .inputFormat('lavfi')
        // Second input - audio with specific timing
        .input(inputPath)
        .inputOptions([
          `-ss ${startTime}`
        ])
        .outputOptions([
          '-map 0:v',
          '-map 1:a',
          '-c:v libx264',
          '-c:a aac',
          '-strict experimental',
          '-b:a 128k',
          '-ar 44100', // Standard audio sample rate
          '-pix_fmt yuv420p',
          '-t 2',
          '-y' // Overwrite output files
        ])
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
    const normalizedTitle = this.normalizeTitle(title);
    return this.songs.find(song => 
        this.normalizeTitle(song.title) === normalizedTitle
    );
  }

  public normalizeTitle(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  }
}
