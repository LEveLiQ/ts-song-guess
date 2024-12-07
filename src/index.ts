import { Client, GatewayIntentBits, Message } from 'discord.js';
import { play, leaderboard, guess } from './commands';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

const PREFIX = '!';

client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
});

client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const [commandName, ...args] = message.content
        .slice(PREFIX.length)
        .trim()
        .split(/\s+/);

    try {
        switch (commandName.toLowerCase()) {
            case 'play':
                await play(message);
                break;
            case 'leaderboard':
                await leaderboard(message);
                break;
            case 'guess':
                await guess(message, args);
                break;
        }
    } catch (error) {
        console.error('Error executing command:', error);
        await message.reply('There was an error executing that command!');
    }
});

client.login(process.env.TOKEN);