import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import readline from 'readline';

// Create db directory if it doesn't exist
const dbDir = path.join(__dirname, '../../data/db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'scores.db');

if (fs.existsSync(dbPath)) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Database already exists. Do you want to delete it? (yes/no): ', (answer: string) => {
        if (answer.toLowerCase() === 'yes') {
            fs.unlinkSync(dbPath);
            console.log('Existing database deleted.');
            rl.close();
            initializeDatabase();
        } else {
            console.log('Keeping existing database.');
            rl.close();
        }

    });
} else {
    initializeDatabase();
    
}

function initializeDatabase() {
    const db = new Database(dbPath);
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
}
