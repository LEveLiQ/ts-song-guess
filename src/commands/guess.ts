import { Message } from 'discord.js';
import { GameStateManager } from '../utils/game_state_manager';
import { db_functions } from '../utils/database';

export const guess = async (message: Message, args: string[]) => {
    const gameState = GameStateManager.getInstance();
    if (!gameState.isGameActive(message.channelId)) {
        await message.reply('There\'s no active game! Start one with !play');
        return;
    }

    if (args.length === 0) {
        await message.reply('Please provide your guess! Example: !guess "song name"');
        return;
    }

    await db_functions.ensurePlayer(message.author.id, message.author.username);
    const guess = args.join(' ');
    const result = gameState.validateGuess(message.channelId, guess);

    if (result.correct) {
        const song = gameState.getSong(message.channelId);
        gameState.endGame(message.channelId);
        await message.reply(`🎉 Correct! The song was **"${song!.title}"**! You win!`);
        db_functions.updateScore(message.author.id, 1, true);
    } else if (result.isValidSong) {
        await message.reply(`❌ **"${result.songTitle}"** is not the correct song! Try again!`);
        db_functions.updateScore(message.author.id, 0, false);
    } else {
        await message.reply('❌ That\'s not a valid song! Try again!');
        db_functions.updateScore(message.author.id, 0, false);
    }
};
