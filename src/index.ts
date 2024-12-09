import { Client, GatewayIntentBits, Interaction } from 'discord.js';
import { registerCommands, handleInteraction } from './commands/slash_commands';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user?.tag}!`);
    await registerCommands(client);
});

client.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isCommand() && !interaction.isAutocomplete()) return;
    await handleInteraction(interaction);
});

client.login(process.env.TOKEN);
