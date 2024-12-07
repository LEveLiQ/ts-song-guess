import { CommandInteraction } from 'discord.js';
import { GameStateManager } from '../utils/game_state_manager';
import { db_functions } from '../utils/database';

export const guess = async (interaction: CommandInteraction, args: string[]) => {
    const gameState = GameStateManager.getInstance();
    if (!gameState.isGameActive(interaction.channelId)) {
        await interaction.reply('There\'s no active game! Start one with /play');
        return;
    }

    if (args.length === 0) {
        await interaction.reply('Please provide your guess! Example: /guess "song name"');
        return;
    }

    await db_functions.ensurePlayer(interaction.user.id, interaction.user.username);
    const guess = args.join(' ');
    const result = gameState.validateGuess(interaction.channelId, guess);

    if (result.correct) {
        const song = gameState.getSong(interaction.channelId);
        gameState.endGame(interaction.channelId);
        await interaction.reply(`🎉 Correct! The song was **"${song!.title}"**! You win!`);
        db_functions.updateScore(interaction.user.id, 1, true);
    } else if (result.isValidSong) {
        await interaction.reply(`❌ **"${result.songTitle}"** is not the correct song! Try again!`);
        db_functions.updateScore(interaction.user.id, 0, false);
    } else {
        await interaction.reply('❌ That\'s not a valid song! Try again!');
        db_functions.updateScore(interaction.user.id, 0, false);
    }
};
