import { Message, AttachmentBuilder } from 'discord.js';
import { SongManager } from '../utils/songs';
import { GameStateManager } from '../utils/game_state_manager';
import { unlink } from 'fs/promises';

export const play = async (message: Message) => {
    const gameState = GameStateManager.getInstance();

    if (gameState.isGameActive(message.channelId)) {
        await message.reply('A game is already in progress in this channel! Wait for it to finish.');
        return;
    }

    const songManager = new SongManager();
    const song = songManager.getRandomSong();
    
    try {
        const snippetPath = await songManager.createSongSnippet(song);
        const attachment = new AttachmentBuilder(snippetPath);
        
        const timeoutId = setTimeout(async () => {
            gameState.endGame(message.channelId);
            await message.channel.send(`⏰ Time's up! The song was **"${song.title}"**! 🎵`);
        }, 60000);

        gameState.startGame(message.channelId, song, timeoutId);
        
        await message.reply({
            content: '🎵 Guess the song! You have 60 seconds.',
            files: [attachment]
        });

        await unlink(snippetPath);
        
    } catch (error) {
        gameState.endGame(message.channelId);
        console.error('Error in play command:', error);
        await message.reply('Sorry, there was an error starting the game!');
    }
};