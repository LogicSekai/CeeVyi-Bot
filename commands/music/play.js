const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play Music!'),
	async execute(interaction) {
		await interaction.reply('Playing Music!');
	},
};