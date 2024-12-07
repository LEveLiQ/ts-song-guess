import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Create db directory if it doesn't exist
const dbDir = path.join(__dirname, '../../data/db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'scores.db'));

// Initialize database tables with singular names
db.exec(`
  CREATE TABLE IF NOT EXISTS player (
    discord_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    total_score INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    correct_guesses INTEGER DEFAULT 0,
    last_played_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS game (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT,
    song_id TEXT,
    guessed_correctly BOOLEAN,
    attempts_taken INTEGER,
    time_taken INTEGER,
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(player_id) REFERENCES player(discord_id)
  );
`);

console.log('Database initialized successfully!');