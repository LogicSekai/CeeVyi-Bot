// Membutuhkan kelas discord.js yang diperlukan
require("dotenv/config")
const { Client, Collection, Events, GatewayIntentBits, IntentsBitField } = require('discord.js');
const fs = require('node:fs')
const path = require('node:path');
const { measureMemory } = require("node:vm");

const { Configuration, OpenAIApi } = require("openai")
const identity = fs.readFileSync('./characterConfig/identity.txt')
let promptNeuro = identity.toString()

const token = process.env.TOKEN;

// Buat instance klien baru
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.MessageContent,
	],
})

// Membuat Koneksi ke OpenAi
const configuration = new Configuration({
	organization: process.env.ORG_KEY_GPT,
    apiKey: process.env.API_KEY_GPT,
});

const openai = new OpenAIApi(configuration);


// Saat klien siap, jalankan kode ini (hanya sekali)
// Kami menggunakan 'c' untuk parameter acara agar tetap terpisah dari 'klien' yang sudah ditentukan
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
})

// // Menambahkan properti .commands ke dalam instance
// client.commands = new Collection()

// // Mengambil file perintah secara dinamis
// const commandsPath = path.join(__dirname, 'commands');
// const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// for (const file of commandFiles) {
// 	const filePath = path.join(commandsPath, file);
// 	const command = require(filePath);
// 	// Set a new item in the Collection with the key as the command name and the value as the exported module
// 	if ('data' in command && 'execute' in command) {
// 		client.commands.set(command.data.name, command);
// 	} else {
// 		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
// 	}
// }

// client.on(Events.InteractionCreate, interaction => {
// 	if (!interaction.isChatInputCommand()) return;
// 	console.log(interaction);
// })

client.on('messageCreate', async (message) => {
	if (message.author.bot) return
	if (message.channel.id !== process.env.CHANNEL_ID) return
	if (message.content.startsWith('!')) return
	
	await message.channel.sendTyping();

    const result = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: promptNeuro + "Q:" + message.content,
        temperature: 0.9,
        max_tokens: 150,
        top_p: 1,
        frequency_penalty: 0.0,
        presence_penalty: 0.6,
        stop: [" Q:", " A:"],
	})

	var ms = result.data.choices[0].text.replace('?', '')
	let cut = ms.indexOf('A:');
	message.reply(ms.substr(cut + 3))
	promptNeuro = promptNeuro + "Q:" + message.content + ms
    fs.writeFileSync('./characterConfig/identity.txt', promptNeuro)
})

// Masuk ke Discord dengan token klien Anda
client.login(token)