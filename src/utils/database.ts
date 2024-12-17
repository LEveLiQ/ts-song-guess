import Database, { RunResult } from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '../../data/db/scores.db'));

interface Player {
  discord_id: string;
  total_score: number;
  total_guesses: number;
  correct_guesses: number;
  last_successful_guess: string;
  last_guessed_difficulty: string;
}

interface LeaderboardEntry {
    discord_id: string;
    total_score: number;
    correct_guesses: number;
    total_guesses: number;
  }

const db_functions = {
  ensurePlayer(discord_id: string, username: string = ''): Player {
    const insertStmt = db.prepare(`
      INSERT INTO player (discord_id, username, last_successful_guess, last_guessed_difficulty)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(discord_id) DO NOTHING
    `);
  
    const selectStmt = db.prepare(`
      SELECT * FROM player WHERE discord_id = ?
    `);
  
    const transaction = db.transaction((discordId) => {
      insertStmt.run(discordId, username, '', '');
      return selectStmt.get(discordId);
    });
  
    return transaction(discord_id) as Player;
  },

  updateScore(discord_id: string, points: number, guessed_correctly: boolean, difficulty: string): RunResult {
    return db.prepare(`
      UPDATE player
      SET total_score = total_score + ?,
          total_guesses = total_guesses + 1,
          correct_guesses = correct_guesses + ?,
          last_successful_guess = CASE WHEN ? = 1 THEN ? ELSE last_successful_guess END,
          last_guessed_difficulty = CASE WHEN ? = 1 THEN ? ELSE last_guessed_difficulty END
      WHERE discord_id = ?
    `).run(points, guessed_correctly ? 1 : 0, guessed_correctly ? 1 : 0, new Date().toString(), guessed_correctly ? 1 : 0, difficulty, discord_id);
  },

  updateLastGuess(discord_id: string): RunResult {
    return db.prepare(`
      UPDATE player
      SET last_successful_guess = ?,
          last_guessed_difficulty = 'Failed'
      WHERE discord_id = ?
    `).run(new Date().toString(), discord_id);
  },

  getLeaderboard(limit = 10): LeaderboardEntry[] {
    return db.prepare(`
      SELECT discord_id, total_score, correct_guesses, total_guesses
      FROM player
      ORDER BY total_score DESC
      LIMIT ?
    `).all(limit) as LeaderboardEntry[];
  },

  removeCooldown(discord_id: string): RunResult {
    return db.prepare(`
      UPDATE player
      SET last_successful_guess = '',
          last_guessed_difficulty = ''
      WHERE discord_id = ?
    `).run(discord_id);
  },

  resetPlayer(discord_id: string): RunResult {
    return db.prepare(`
      DELETE FROM player
      WHERE discord_id = ?
    `).run(discord_id);
  }
};

export { db, db_functions, Player, LeaderboardEntry };
