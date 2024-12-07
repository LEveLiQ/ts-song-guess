import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '../../data/db/scores.db'));

interface Player {
  discord_id: string;
  username: string;
  total_score: number;
  total_guesses: number;
  correct_guesses: number;
  last_played_at: string;
  created_at: string;
}

interface LeaderboardEntry {
    discord_id: string;
    username: string;
    total_score: number;
    correct_guesses: number;
    total_guesses: number;
  }

const db_functions = {
  ensurePlayer(discord_id: string, username: string): Player {
    return db.prepare(`
      INSERT INTO player (discord_id, username)
      VALUES (?, ?)
      ON CONFLICT(discord_id) DO UPDATE SET
      username = excluded.username
      RETURNING *
    `).get(discord_id, username) as Player; 
  },

  updateScore(discord_id: string, points: number, guessed_correctly: boolean) {
    return db.prepare(`
      UPDATE player
      SET total_score = total_score + ?,
          total_guesses = total_guesses + 1,
          correct_guesses = correct_guesses + ?,
          last_played_at = CURRENT_TIMESTAMP
      WHERE discord_id = ?
    `).run(points, guessed_correctly ? 1 : 0, discord_id);
  },

  getLeaderboard(limit = 10): LeaderboardEntry[] {
    return db.prepare(`
      SELECT discord_id, username, total_score, correct_guesses, total_guesses
      FROM player
      ORDER BY total_score DESC
      LIMIT ?
    `).all(limit) as LeaderboardEntry[];
  }
};

export { db, db_functions, Player, LeaderboardEntry };