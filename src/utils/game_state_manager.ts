import { Song, SongManager } from './songs';  // Import the Song type/interface

export class GameStateManager {
    private static instance: GameStateManager;
    private activeGames: Map<string, {
        channelId: string,
        startedAt: Date,
        timeoutId?: NodeJS.Timeout
        song: Song
    }> = new Map();
    private songManager: SongManager;

    private constructor() {
        this.songManager = new SongManager();
    }

    public static getInstance(): GameStateManager {
        if (!GameStateManager.instance) {
            GameStateManager.instance = new GameStateManager();
        }
        return GameStateManager.instance;
    }

    public isGameActive(channelId: string): boolean {
        this.cleanupExpiredGames();
        return this.activeGames.has(channelId);
    }

    public startGame(channelId: string, song: Song, timeoutId: NodeJS.Timeout): void {
        this.activeGames.set(channelId, {
            channelId,
            startedAt: new Date(),
            song,
            timeoutId
        });
    }

    public validateGuess(channelId: string, guess: string): {
        correct: boolean;
        isValidSong: boolean;
        songTitle?: string;
    } {
        const game = this.activeGames.get(channelId);
        if (!game) return { correct: false, isValidSong: false };

        const normalizedGuess = guess.toLowerCase().trim();
        
        // Use SongManager to find the song
        const guessedSong = this.songManager.findSongByTitle(normalizedGuess);

        // If it exists but isn't the correct song
        if (guessedSong && guessedSong.id !== game.song.id) {
            return {
                correct: false,
                isValidSong: true,
                songTitle: guessedSong.title
            };
        }

        // If it's the correct song
        if (normalizedGuess === game.song.title.toLowerCase().trim()) {
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
}