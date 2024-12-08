import { CommandInteraction, AttachmentBuilder } from 'discord.js';
import { SongManager } from '../utils/songs';
import { GameStateManager } from '../utils/game_state_manager';
import { unlink } from 'fs/promises';
import config from '../../config.json';

export const play = async (interaction: CommandInteraction, difficulty: string) => {
    const gameState = GameStateManager.getInstance();
    const cooldown = gameState.isCooldownActive(interaction.user.id);
    if (cooldown) {
        await interaction.reply({ content: `You are on a cooldown! Please wait **${cooldown}** seconds before guessing again.`, ephemeral: true });
        return;
    }
    if (gameState.isGameActive(interaction.channelId!)) {
        await interaction.reply({ content: 'A game is already in progress in this channel! Wait for it to finish.', ephemeral: true });
        return;
    }

    const songManager = new SongManager(difficulty);
    const song = songManager.getRandomSong();
    
    try {
        const snippetPath = await songManager.createSongSnippet(song, difficulty);
        const attachment = new AttachmentBuilder(snippetPath);
        
        const getTimeLimit = (difficulty: string) => {
            return config.timeLimits[difficulty as keyof typeof config.timeLimits] || 60;
        }

        const timeoutId = setTimeout(async () => {
            gameState.endGame(interaction.channelId!);
                if (interaction.channel?.isTextBased() && 'send' in interaction.channel) {
                    await interaction.channel.send(`⏰ Time's up! The song was **"${song.title}"**! 🎵`);
                }
        }, getTimeLimit(difficulty) * 1000);

        gameState.startGame(interaction.channelId!, song, timeoutId, difficulty);
        
        await interaction.reply({
            content: `🎵 Guess the song! You have **${getTimeLimit(difficulty)}** seconds. Difficulty: **${difficulty}**`,
            files: [attachment]
        });

        await unlink(snippetPath);
        
    } catch (error) {
        gameState.endGame(interaction.channelId!);
        console.error('Error in play command:', error);
        await interaction.reply('Sorry, there was an error starting the game!');
    }
};
