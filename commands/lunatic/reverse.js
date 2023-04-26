const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageAttachment } = require('discord.js')
require('dotenv/config')
const axios = require('axios')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reverse')
		.setDescription('Menerima URL gambar dan mencari judul Anime.')
		.addStringOption(option =>
			option.setName('url')
				.setDescription('URL gambar yang akan di proses')
				.setRequired(true)),
	async execute(interaction) {
		const imageUrl = interaction.options.getString('url')
		
        await interaction.channel.sendTyping()
		await interaction.deferReply()

		axios.get(process.env.LUNATIC_REVERSE_SERVER + imageUrl)
		.then(async (response) => {
			let result = response.data.result[0]
			let similarity = result.similarity * 100
			let similar = similarity.toString()

			axios.get(process.env.MAL_API_SERVER + result.anilist.idMal)
				.then(async resultMAL => {
				let _similar
				if (similar.slice(0, similar.indexOf('.')) === '10') {
					_similar = 100
				} else {
					_similar = similar.slice(0, similar.indexOf('.'))
				}
				let messageTemplate = '***Hasil pencarian ' + _similar +
				'% mirip dengan:***\n\nTitle: ' + result.anilist.title.romaji +
				'\nType: ' + resultMAL.data.data.type +
				'\nEpisode: ' + resultMAL.data.data.episodes +
				'\nAired from: ' + resultMAL.data.data.aired.from.slice(0, 10) +
				'\nStatus: ' + resultMAL.data.data.status +
				'\nScore: ' + resultMAL.data.data.score +
				'\n\n' + resultMAL.data.data.images.jpg.image_url
				
				const btnDetail = new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setLabel('Detail')
					.setURL(process.env.LUNATIC_SERVER + 'track_resource/details/' + result.anilist.id + '/' + result.anilist.idMal + '?pin=' + imageUrl);

				const btnMore = new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setLabel('10 Lainnya')
						.setURL('https://lunatic.logicsekai.com');
					
				const actionRow = new ActionRowBuilder().addComponents(btnDetail, btnMore);

				await interaction.followUp({content: messageTemplate, components: [actionRow]})
			}).catch(async err => {
				await interaction.followUp('Terjadi kesalahan saat memproses gambar')
            });
		}).catch(async (err) => {
			await interaction.followUp('Terjadi kesalahan saat memproses gambar 1')
		})
	},
};