import { Song, SongManager } from './songs';
import { db_functions } from './database';
import config from '../../config.json';

export class GameStateManager {
    private static instance: GameStateManager;
    private activeGames: Map<string, {
        channelId: string,
        startedAt: Date,
        timeoutId?: NodeJS.Timeout
        song: Song,
        difficulty: string,
        guessedUsers?: string[]
    }> = new Map();
    private songManager: SongManager | null = null;
    private currentDifficulty: string | null = null;
    private commandQueue: Map<string, boolean> = new Map();

    private constructor() {}

    public static getInstance(): GameStateManager {
        if (!GameStateManager.instance) {
            GameStateManager.instance = new GameStateManager();
        }
        return GameStateManager.instance;
    }

    public async executeCommand(channelId: string, command: () => Promise<void>): Promise<void> {
        if (this.commandQueue.get(channelId)) {
            return;
        }
        
        try {
            this.commandQueue.set(channelId, true);
            await command();
        } finally {
            this.commandQueue.delete(channelId);
        }
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

    public addGuessedUser(channelId: string, userId: string): void {
        const game = this.activeGames.get(channelId);
        if (!game) return;

        if (!game.guessedUsers) {
            game.guessedUsers = [];
        }

        if (!game.guessedUsers.includes(userId)) {
            game.guessedUsers.push(userId);
        }
    }

    public validateGuess(channelId: string, guess: string): {
        correct: boolean;
        isValidSong: boolean;
        songTitle?: string;
    } {
        const game = this.activeGames.get(channelId);
        if (!game) return { correct: false, isValidSong: false };

        const normalizedGuess = this.songManager!.normalizeTitle(guess);
        
        const guessedSong = this.songManager!.findSongByTitle(normalizedGuess);

        if (normalizedGuess === this.songManager!.normalizeTitle(game.song.title) ||
        (game.difficulty !== 'Extreme' && game.song.aliases && game.song.aliases.some(alias => normalizedGuess === this.songManager!.normalizeTitle(alias)))) {
            return {
                correct: true,
                isValidSong: true,
                songTitle: game.song.title
            };
        }

        if (guessedSong && guessedSong.id !== game.song.id) {
            return {
                correct: false,
                isValidSong: true,
                songTitle: guessedSong.title
            };
        }

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

    public endGame(channelId: string, gameEndedByTimeout: boolean): void {
        const game = this.activeGames.get(channelId);
        if (!game) return;

        clearTimeout(game.timeoutId);
        if (gameEndedByTimeout) {
            if (game.guessedUsers) {
                game.guessedUsers.forEach(userId => {
                    db_functions.updateLastGuess(userId);
                });
            }
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
        const player = db_functions.ensurePlayer(userId);
        if (!player.last_successful_guess) return null;

        const lastGuessTime = new Date(player.last_successful_guess).getTime();
        const now = Date.now();
        const cooldownPeriod = this.getCooldownPeriod(player.last_guessed_difficulty);
        const timeRemaining = cooldownPeriod - (now - lastGuessTime);

        return timeRemaining > 0 ? Math.ceil(timeRemaining / 1000) : null;
    }

    private getCooldownPeriod(difficulty: string): number {
        return config.cooldownPeriods[difficulty as keyof typeof config.cooldownPeriods] * 1000 || 0;
    }
}