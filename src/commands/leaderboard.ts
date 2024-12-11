import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { db_functions, LeaderboardEntry } from '../utils/database';

export const leaderboard = async (interaction: CommandInteraction) => {
    const leaders: LeaderboardEntry[] = db_functions.getLeaderboard();
    const leaderText = await Promise.all(leaders.map(async (p, i) => {
        const accuracy = p.total_guesses > 0 
            ? Math.round((p.correct_guesses / p.total_guesses) * 100) 
            : 0;
        
        const member = await interaction.guild?.members.fetch(p.discord_id).catch(() => null);
        
        return `${i + 1}. <@${member?.id}> :󠇰 **${p.total_score}** points | ${accuracy}% accuracy (${p.correct_guesses}/${p.total_guesses})`;
    }));

    const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('🏆  Song Guess Leaderboard')
        .setDescription(leaderText.join('\n') || 'No players yet!')
        .setTimestamp()
        .setFooter({ text: 'Updated' });

    await interaction.reply({ embeds: [embed] });
};