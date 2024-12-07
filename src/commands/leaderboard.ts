import { Message } from 'discord.js';
import { db_functions, LeaderboardEntry } from '../utils/database';

export const leaderboard = async (message: Message) => {
    const leaders: LeaderboardEntry[] = db_functions.getLeaderboard();
    const leaderText = await Promise.all(leaders.map(async (p, i) => {
        const accuracy = p.games_played > 0 
            ? Math.round((p.correct_guesses / p.games_played) * 100) 
            : 0;
        
        const member = await message.guild?.members.fetch(p.discord_id).catch(() => null);
        const displayName = member?.nickname || member?.user.globalName || p.username;
        
        return `${i + 1}. ${displayName} (\`${p.username}\`) - ${p.total_score} points (${accuracy}% accuracy, ${p.correct_guesses}/${p.games_played} correct)`;
    }));

    message.reply(`🏆 **Leaderboard:**\n${leaderText.join('\n') || 'No players yet!'}`);
};