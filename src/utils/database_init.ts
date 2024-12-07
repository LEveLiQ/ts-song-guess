import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Create db directory if it doesn't exist
const dbDir = path.join(__dirname, '../../data/db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'scores.db'));

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS player (
    discord_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    total_score INTEGER DEFAULT 0,
    total_guesses INTEGER DEFAULT 0,
    correct_guesses INTEGER DEFAULT 0,
    last_successful_guess STRING,
    last_guessed_difficulty TEXT
  );
`);

console.log('Database initialized successfully!');
