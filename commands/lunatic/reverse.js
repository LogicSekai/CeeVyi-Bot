const { SlashCommandBuilder, MessageActionRow, MessageButton } = require('discord.js')
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
		// const imageUrl = 'https://assets.pikiran-rakyat.com/crop/0x0:0x0/x/photo/2023/01/12/1616827217.jpg'
		
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
				await interaction.followUp(messageTemplate)
			}).catch(async err => {
				await interaction.reply('Terjadi kesalahan saat memproses gambar')
            });
		}).catch(async (err) => {
			await interaction.reply('Terjadi kesalahan saat memproses gambar 1')
		})

		// await interaction.reply('Anda mengirim url ' + imageUrl)
	},
};