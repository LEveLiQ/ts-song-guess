import { CommandInteraction } from 'discord.js';
import { GameStateManager } from '../utils/game_state_manager';
import { db_functions } from '../utils/database';

export const guess = async (interaction: CommandInteraction, args: string[]) => {
    const gameState = GameStateManager.getInstance();
    const cooldown = gameState.isCooldownActive(interaction.user.id);
    if (cooldown) {
        await interaction.reply({ content: `You are on a cooldown! Please wait **${cooldown}** seconds before guessing again.`, ephemeral: true });
        return;
    }
    if (!gameState.isGameActive(interaction.channelId)) {
        await interaction.reply({ content: 'There\'s no active game! Start one with </play:1314902142422880298>', ephemeral: true });
        return;
    }

    await db_functions.ensurePlayer(String(interaction.user.id), String(interaction.user.username));
    const guess = args.join(' ');
    const result = gameState.validateGuess(interaction.channelId, guess);

    if (result.correct) {
        const song = gameState.getSong(interaction.channelId);
        await interaction.reply(`🎉 Correct! The song was **"${song!.title}"**!`);
        const difficulty = gameState.getDifficulty(interaction.channelId);
        switch (difficulty) {
            case 'Normal':
                db_functions.updateScore(interaction.user.id, 1, true, difficulty);
                break;
            case 'Hard':
                db_functions.updateScore(interaction.user.id, 2, true, difficulty);
                break;
            case 'Extreme':
                db_functions.updateScore(interaction.user.id, 3, true, difficulty);
                break;
        }
        gameState.endGame(interaction.channelId);
    } else if (result.isValidSong) {
        await interaction.reply(`❌ **"${result.songTitle}"** is not the correct song! Try again!`);
        db_functions.updateScore(interaction.user.id, 0, false, '');
    } else {
        await interaction.reply('❌ That\'s not a valid song! Try again!');
        db_functions.updateScore(interaction.user.id, 0, false, '');
    }
};
