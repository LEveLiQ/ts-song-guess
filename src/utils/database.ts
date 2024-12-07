import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '../../data/db/scores.db'));

interface Player {
  discord_id: string;
  username: string;
  total_score: number;
  games_played: number;
  correct_guesses: number;
  last_played_at: string;
  created_at: string;
}

interface LeaderboardEntry {
    discord_id: string;
    username: string;
    total_score: number;
    correct_guesses: number;
    games_played: number;
  }

const db_functions = {
  ensurePlayer(discord_id: string, username: string): Player {
    return db.prepare(`
      INSERT INTO player (discord_id, username)
      VALUES (?, ?)
      ON CONFLICT(discord_id) DO UPDATE SET
      username = excluded.username
      RETURNING *
    `).get(discord_id, username) as Player;  // Add type assertion here
  },

  updateScore(discord_id: string, points: number, guessed_correctly: boolean) {
    return db.prepare(`
      UPDATE player
      SET total_score = total_score + ?,
          games_played = games_played + 1,
          correct_guesses = correct_guesses + ?,
          last_played_at = CURRENT_TIMESTAMP
      WHERE discord_id = ?
    `).run(points, guessed_correctly ? 1 : 0, discord_id);
  },

  getLeaderboard(limit = 10): LeaderboardEntry[] {
    return db.prepare(`
      SELECT discord_id, username, total_score, correct_guesses, games_played
      FROM player
      ORDER BY total_score DESC
      LIMIT ?
    `).all(limit) as LeaderboardEntry[];
  },

  recordGame(player_id: string, song_id: string, guessed_correctly: boolean, attempts: number, time_taken: number) {
    return db.prepare(`
      INSERT INTO game 
      (player_id, song_id, guessed_correctly, attempts_taken, time_taken)
      VALUES (?, ?, ?, ?, ?)
    `).run(player_id, song_id, guessed_correctly, attempts, time_taken);
  }
};

export { db, db_functions, Player, LeaderboardEntry };