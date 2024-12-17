import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import { readFileSync } from 'fs';
import config from '../../config.json';

if (!ffmpegStatic) {
    throw new Error('ffmpeg-static path is null. Please ensure ffmpeg-static is properly installed.');
}

ffmpeg.setFfmpegPath(ffmpegStatic);

export interface Song {
  id: string;
  title: string;
  filePath: string;
  aliases?: string[];
}

export class SongManager {
  private songs: Song[];
  private readonly songsDir: string;

  constructor(difficulty: string) {
    this.songsDir = path.join(__dirname, '../../data/songs');
    this.songs = this.loadSongs(difficulty);
  }
  private loadSongs(difficulty: string): Song[] {
    const songsPath = path.join(__dirname, `../../data/songs.json`);
    const preSongsPath = path.join(__dirname, `../../data/songs_pre.json`);
    try {
      const data = readFileSync(songsPath, 'utf8');
      const { songs } = JSON.parse(data);

      if (difficulty === 'Hard' || difficulty === 'Extreme') {
        const preData = readFileSync(preSongsPath, 'utf8');
        const { songs: preSongs } = JSON.parse(preData);
        return songs.concat(preSongs);
      }

      return songs;
    } catch (error) {
      console.error('Error loading songs:', error);
      return [];
    }
  }

  public getAllSongTitles(): string[] {
    return this.songs.map(song => song.title);
  }

  public getRandomSong(): Song {
    const randomIndex = Math.floor(Math.random() * this.songs.length);
    return this.songs[randomIndex];
  }

  public async createSongSnippet(song: Song, difficulty: string): Promise<string> {
    const inputPath = path.join(this.songsDir, song.filePath);
    const outputPath = path.join(this.songsDir, `guess.mp4`);
    
    const startTime = Math.floor(Math.random() * (config.randomSnippetGeneration.end - config.randomSnippetGeneration.start)) + config.randomSnippetGeneration.start;
    const duration = config.songSnippetDurations[difficulty as keyof typeof config.songSnippetDurations] || 2;

    return new Promise((resolve, reject) => {
      ffmpeg()
      // First input - the PNG image
      .input(path.join(__dirname, '../../data/thumb.png'))
      .inputFormat('image2')
      // Second input - audio with specific timing
      .input(inputPath)
      .inputOptions([
        `-ss ${startTime}`
      ])
      .outputOptions([
        '-map 0:v',
        '-map 1:a',
        '-c:v libx264',
        '-profile:v baseline',   // Use baseline profile
        '-movflags +faststart',   // Move MOOV atom to the start for better streaming
        '-r 30',                // Enforce constant frame rate of 30 fps
        '-c:a aac',
        '-b:a 128k', // Ensure consistent audio bitrate
        '-ar 44100',
        '-pix_fmt yuvj420p',
        '-color_range 1',
        '-colorspace bt709',
        `-t ${duration}`,
        '-y'
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

  public findSongAlias(title: string): Song | undefined {
    const normalizedTitle = this.normalizeTitle(title);
    return this.songs.find(song => 
        song.aliases && song.aliases.some(alias => 
            this.normalizeTitle(alias) === normalizedTitle
        )
    );
  }

  public normalizeTitle(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  }
}
