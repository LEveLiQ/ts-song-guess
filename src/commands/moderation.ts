import { CommandInteraction, GuildMember } from 'discord.js';
import { db_functions } from '../utils/database';
import config from '../../config.json';

const hasModeratorRole = (interaction: CommandInteraction): boolean => {
    const member = interaction.member as GuildMember;
    return member?.roles?.cache?.hasAny(...config.moderatorRoleId) ?? false;
};

export const removeCooldown = async (interaction: CommandInteraction, args: string[]) => {
    if (!hasModeratorRole(interaction)) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
    }

    const userId = args[0];
    if (db_functions.removeCooldown(userId).changes === 0)
        await interaction.reply({ content: `This user has not played the game yet.`, ephemeral: true });
    else await interaction.reply({ content: `Cooldown removed for <@${userId}>.`, ephemeral: true });
};

export const resetPlayer = async (interaction: CommandInteraction, args: string[]) => {
    if (!hasModeratorRole(interaction)) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
    }

    const userId = args[0];
    if (db_functions.resetPlayer(userId))
        await interaction.reply({ content: `This user has not played the game yet.`, ephemeral: true });
    else await interaction.reply({ content: `Player data reset for <@${userId}>.`, ephemeral: true });
};