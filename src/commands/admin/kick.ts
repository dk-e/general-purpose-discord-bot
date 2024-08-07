import { ChannelType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { CommandConfig } from "../../classes/CommandConfig";
import { Command } from "../../classes/Command";
import config from "../../config";

const commandBuilder = new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kicks a member from a guild")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

commandBuilder.addUserOption((option) => option.setName("user").setDescription("The user to kick").setRequired(true));
commandBuilder.addStringOption((option) => option.setName("reason").setDescription("The reason for kicking the user").setRequired(false));

const commandConfig = new CommandConfig(commandBuilder);

const command = async (interaction: ChatInputCommandInteraction) => {
    const user = await interaction.guild?.members.fetch(interaction.options.getUser("user")?.id!);
    const reason = interaction.options.getString("reason");
    const member = await interaction.guild?.members.fetch(interaction.user.id);

    const userEmbed = new EmbedBuilder().setColor(config.colours.failure);
    const serverEmbed = new EmbedBuilder().setColor(config.colours.blurple);

    if (user?.user.id === member?.user.id) {
        return await interaction.reply({
            embeds: [serverEmbed.setDescription(`${config.emojis.error} You cannot kick yourself`).setColor(config.colours.failure)],
            ephemeral: true,
        });
    }

    if (user?.roles.highest!! >= member?.roles.highest!) {
        return await interaction.reply({
            embeds: [
                serverEmbed
                    .setDescription(
                        `${config.emojis.error} You cannot kick ${user?.user}\n**Reason:** Your top role is not higher than ${user?.user}'s`
                    )
                    .setColor(config.colours.failure),
            ],
            ephemeral: true,
        });
    }

    if (user?.user.id === interaction.client.user.id) {
        return await interaction.reply({
            embeds: [serverEmbed.setDescription(`${config.emojis.error} You cannot kick this bot`).setColor(config.colours.failure)],
            ephemeral: true,
        });
    }

    if (!user?.kickable) {
        return await interaction.reply({
            embeds: [serverEmbed.setDescription(`${config.emojis.error} ${user} cannot be kicked by me`).setColor(config.colours.failure)],
            ephemeral: true,
        });
    }

    userEmbed.setTitle("Kicked");
    userEmbed.setDescription(
        [
            `**Server**: \`${interaction.guild?.name}\``,
            `**Moderator**: ${member?.user} (${member?.user.id})`,
            `**Reason**: \`${reason ? reason : "no reason provided"}\``,
        ].join("\n")
    );
    userEmbed.setTimestamp();

    serverEmbed.setTitle("Kicked");
    serverEmbed.setDescription(
        [
            `**User**: ${user} (${user?.id})`,
            `**Moderator**: ${member?.user} (${member?.user.id})`,
            `**Reason**: \`${reason ? reason : "no reason provided"}\``,
        ].join("\n")
    );
    serverEmbed.setColor(config.colours.blurple);

    const logsChannel = await interaction.guild?.channels.fetch(config.channels.logs);
    if (!logsChannel || logsChannel.type !== ChannelType.GuildText) {
        return await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(config.colours.failure)
                    .setDescription("Invalid logs channel. Please update `config.yaml` with a valid text channel id"),
            ],
        });
    }

    await user?.send({ embeds: [userEmbed] });
    await user?.kick();
    await logsChannel.send({ embeds: [serverEmbed] });
    return await interaction.reply({
        embeds: [new EmbedBuilder().setDescription(`${config.emojis.success} ***${user}*** was kicked`).setColor(config.colours.success)],
    });
};
export default new Command(commandConfig, command);
