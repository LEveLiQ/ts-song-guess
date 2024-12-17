import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Client, CommandInteraction, CommandInteractionOptionResolver, AutocompleteInteraction } from 'discord.js';
import { SongManager } from '../utils/songs';
import { GameStateManager } from '../utils/game_state_manager';
import { play } from './play';
import { leaderboard } from './leaderboard';
import { guess } from './guess';
import { removeCooldown, resetPlayer } from './moderation';
import * as fs from 'fs/promises';
import * as path from 'path';

const commands = [
    new SlashCommandBuilder()
        .setName('play')
        .setDescription('Start a new game')
        .addStringOption(option => 
            option.setName('difficulty')
                .setDescription('Select difficulty level')
                .setRequired(false)
                .addChoices(
                    { name: 'Normal', value: 'Normal' },
                    { name: 'Hard', value: 'Hard' },
                    { name: 'Extreme', value: 'Extreme' }
                )),
    new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show the leaderboard'),
    new SlashCommandBuilder()
        .setName('guess')
        .setDescription('Make a guess')
        .addStringOption(option => 
            option.setName('song')
                .setDescription('The name of the song')
                .setRequired(true)
                .setAutocomplete(true)),
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show game information and how to play'),
    new SlashCommandBuilder()
        .setName('remove-cooldown')
        .setDescription('Remove cooldown for a user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('User to remove cooldown from')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('reset-player')
        .setDescription('Reset a player\'s data')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Player to reset')
                .setRequired(true)),
].map(command => command.toJSON());

export const registerCommands = async (client: Client) => {
    const rest = new REST({ version: '9' }).setToken(process.env.TOKEN!);

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(client.user!.id, process.env.GUILD_ID!),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
};

export const handleInteraction = async (interaction: CommandInteraction | AutocompleteInteraction) => {
    if (interaction.isAutocomplete()) {
        if (interaction.commandName === 'guess') {
            const focusedValue = interaction.options.getFocused();
            const songManager = new SongManager('Extreme');
            const songs = songManager.getAllSongTitles();
            
            const normalizedInput = songManager.normalizeTitle(focusedValue);
            const filtered = songs
                .filter(song => songManager.normalizeTitle(song).includes(normalizedInput))
                .slice(0, 25)
                .map(song => ({
                    name: song,
                    value: song
                }));
                
            await interaction.respond(filtered);
        }
        return;
    }

    const { commandName, options } = interaction as CommandInteraction & { options: CommandInteractionOptionResolver };

    await GameStateManager.getInstance().executeCommand(interaction.channelId!, async () => {
        try {
            switch (commandName) {
                case 'play': {
                    const difficulty = options.getString('difficulty', false) ?? 'Normal';
                    await play(interaction, difficulty);
                    break;
                }
                case 'leaderboard': {
                    await leaderboard(interaction);
                    break;
                }
                case 'guess': {
                    const song = options.getString('song', true);
                    await guess(interaction, [song]);
                    break;
                }
                case 'help': {
                    const content = await fs.readFile(path.join(__dirname, '../../help.md'), 'utf8');
                    await interaction.reply({ content, ephemeral: true });
                    break;
                }
                case 'remove-cooldown': {
                    const user = options.getUser('user', true);
                    await removeCooldown(interaction, [user.id]);
                    break;
                }
                case 'reset-player': {
                    const user = options.getUser('user', true);
                    await resetPlayer(interaction, [user.id]);
                    break;
                }
            }
        } catch (error) {
            console.error('Error handling interaction:', error);
            // await interaction.reply('There was an error executing that command!');
        }
    });
};