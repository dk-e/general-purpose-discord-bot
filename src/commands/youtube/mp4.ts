import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { CommandConfig } from "../../classes/CommandConfig";
import { Command } from "../../classes/Command";
import { Readable } from "stream";

const commandBuilder = new SlashCommandBuilder().setName("mp4").setDescription("Download a YouTube video as an MP4 file.");
commandBuilder.addStringOption((option) => option.setName("link").setDescription("The YouTube video link").setRequired(true));

const commandConfig = new CommandConfig(commandBuilder);

const command = async (interaction: ChatInputCommandInteraction) => {
    const link = interaction.options.getString("link");

    if (!link) {
        return await interaction.reply({ content: "Please provide a valid YouTube link.", ephemeral: true });
    }

    try {
        const response = await fetch("https://media-download-api.onrender.com/youtube/downloadMp4", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ link }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const readableStream = new Readable();
        readableStream._read = () => {};
        readableStream.push(buffer);
        readableStream.push(null);

        const attachment = {
            attachment: readableStream,
            name: "audio.mp4",
        };

        await interaction.reply({ files: [attachment] });
    } catch (error: any) {
        console.error("Error fetching MP4 file:", error);
        await interaction.reply({ content: `There was an error fetching the MP4 file: ${error.message}`, ephemeral: true });
    }
};

export default new Command(commandConfig, command);
