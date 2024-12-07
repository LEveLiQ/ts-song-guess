import { CommandInteraction, AttachmentBuilder } from 'discord.js';
import { SongManager } from '../utils/songs';
import { GameStateManager } from '../utils/game_state_manager';
import { unlink } from 'fs/promises';

export const play = async (interaction: CommandInteraction, difficulty: string) => {
    const gameState = GameStateManager.getInstance();

    if (gameState.isGameActive(interaction.channelId!)) {
        await interaction.reply('A game is already in progress in this channel! Wait for it to finish.');
        return;
    }

    const songManager = new SongManager(difficulty);
    const song = songManager.getRandomSong();
    
    try {
        const snippetPath = await songManager.createSongSnippet(song, difficulty);
        const attachment = new AttachmentBuilder(snippetPath);
        
        const timeoutId = setTimeout(async () => {
            gameState.endGame(interaction.channelId!);
                if (interaction.channel?.isTextBased() && 'send' in interaction.channel) {
                    await interaction.channel.send(`⏰ Time's up! The song was **"${song.title}"**! 🎵`);
                }
        }, 60000);

        gameState.startGame(interaction.channelId!, song, timeoutId, difficulty);
        
        await interaction.reply({
            content: `🎵 Guess the song! You have 60 seconds. Difficulty: **${difficulty}**`,
            files: [attachment]
        });

        await unlink(snippetPath);
        
    } catch (error) {
        gameState.endGame(interaction.channelId!);
        console.error('Error in play command:', error);
        await interaction.reply('Sorry, there was an error starting the game!');
    }
};
