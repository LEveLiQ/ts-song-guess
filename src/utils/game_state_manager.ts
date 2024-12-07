import { Song, SongManager } from './songs';  // Import the Song type/interface
import { db_functions } from './database'; // Import database functions

export class GameStateManager {
    private static instance: GameStateManager;
    private activeGames: Map<string, {
        channelId: string,
        startedAt: Date,
        timeoutId?: NodeJS.Timeout
        song: Song,
        difficulty: string
    }> = new Map();
    private songManager: SongManager | null = null;
    private currentDifficulty: string | null = null;

    private constructor() {}

    public static getInstance(): GameStateManager {
        if (!GameStateManager.instance) {
            GameStateManager.instance = new GameStateManager();
        }
        return GameStateManager.instance;
    }

    private initializeSongManager(): void {
        if (!this.songManager && this.currentDifficulty) {
            this.songManager = new SongManager(this.currentDifficulty);
        }
    }

    public isGameActive(channelId: string): boolean {
        this.cleanupExpiredGames();
        return this.activeGames.has(channelId);
    }

    public startGame(channelId: string, song: Song, timeoutId: NodeJS.Timeout, difficulty: string): void {
        this.currentDifficulty = difficulty;
        this.initializeSongManager();

        this.activeGames.set(channelId, {
            channelId,
            startedAt: new Date(),
            song,
            timeoutId,
            difficulty
        });
    }

    public validateGuess(channelId: string, guess: string): {
        correct: boolean;
        isValidSong: boolean;
        songTitle?: string;
    } {
        const game = this.activeGames.get(channelId);
        if (!game) return { correct: false, isValidSong: false };

        const normalizedGuess = this.songManager!.normalizeTitle(guess);
        
        // Use SongManager to find the song
        const guessedSong = this.songManager!.findSongByTitle(normalizedGuess);

        // If it exists but isn't the correct song
        if (guessedSong && guessedSong.id !== game.song.id) {
            return {
                correct: false,
                isValidSong: true,
                songTitle: guessedSong.title
            };
        }

        // If it's the correct song
        if (normalizedGuess === this.songManager!.normalizeTitle(game.song.title)) {
            return {
                correct: true,
                isValidSong: true,
                songTitle: game.song.title
            };
        }

        // If the song doesn't exist in our database
        return {
            correct: false,
            isValidSong: false
        };
    }

    public getSong(channelId: string): Song | null {
        const game = this.activeGames.get(channelId);
        return game ? game.song : null;
    }

    public getDifficulty(channelId: string): string | null {
        const game = this.activeGames.get(channelId);
        return game ? game.difficulty : null;
    }

    public endGame(channelId: string): void {
        const game = this.activeGames.get(channelId);
        if (game?.timeoutId) {
            clearTimeout(game.timeoutId);
        }
        this.activeGames.delete(channelId);
    }

    private cleanupExpiredGames(): void {
        const now = new Date();
        for (const [channelId, game] of this.activeGames.entries()) {
            const gameAge = now.getTime() - game.startedAt.getTime();
            if (gameAge > 60000) {
                this.activeGames.delete(channelId);
            }
        }
    }

    public isCooldownActive(userId: string): number | null {
        const player = db_functions.ensurePlayer(userId, '');
        if (!player.last_successful_guess) return null;

        const lastGuessTime = new Date(player.last_successful_guess).getTime();
        const now = Date.now();
        const cooldownPeriod = this.getCooldownPeriod(player.last_guessed_difficulty);
        const timeRemaining = cooldownPeriod - (now - lastGuessTime);

        return timeRemaining > 0 ? Math.ceil(timeRemaining / 1000) : null;
    }

    private getCooldownPeriod(difficulty: string): number {
        switch (difficulty) {
            case 'Normal':
                return 30000;
            case 'Hard':
                return 20000;
            case 'Extreme':
                return 10000;
            default:
                return 30000;
        }
    }
}