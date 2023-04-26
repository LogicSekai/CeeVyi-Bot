const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, EmbedBuilder } = require('discord.js')
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
				'\nScore: ' + resultMAL.data.data.score
				
				const btnDetail = new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setLabel('Detail')
					.setURL(process.env.LUNATIC_SERVER + 'track_resource/details/' + result.anilist.id + '/' + result.anilist.idMal + '?pin=' + imageUrl);

				const btnMore = new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setLabel('10 Lainnya')
					.setURL('https://lunatic.logicsekai.com');
					
				const btnMAL = new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setLabel('MyAnimeList')
					.setURL(resultMAL.data.data.url)

				const actionRow = new ActionRowBuilder().addComponents(btnDetail, btnMore, btnMAL)
				// await interaction.followUp({ content: messageTemplate, components: [actionRow] })
				const user = interaction.member.user;
				const username = user.username;
				const discriminator = user.discriminator;
					
				const embedTemplate = new EmbedBuilder()
					.setColor(0x0099FF)
					.setTitle(result.anilist.title.romaji)
					.setURL(process.env.LUNATIC_SERVER + 'track_resource/details/' + result.anilist.id + '/' + result.anilist.idMal + '?pin=' + imageUrl)
					.setAuthor({ name: 'Lunatic', iconURL: 'https://cdn.discordapp.com/avatars/478794091078090772/a_71572eea57ab0694103234c34f4e786f.gif?size=1024', url: 'https://lunatic.logicsekai.com' })
					.setDescription(messageTemplate)
					.setThumbnail(resultMAL.data.data.images.jpg.image_url)
					.setImage(resultMAL.data.data.images.jpg.image_url)
					.setTimestamp()
					.setFooter({ text: `Requested by ${username}#${discriminator}`, iconURL: user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) });
					
				await interaction.followUp({ embeds: [embedTemplate], components: [actionRow] });
			}).catch(async err => {
				await interaction.followUp('Terjadi kesalahan saat memproses gambar')
            });
		}).catch(async (err) => {
			await interaction.followUp('Terjadi kesalahan saat memproses gambar 1')
		})
	},
};