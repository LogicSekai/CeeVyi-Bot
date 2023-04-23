// Membutuhkan kelas discord.js yang diperlukan
require("dotenv/config")
const { Client, Collection, Events, GatewayIntentBits, IntentsBitField, REST, Routes } = require('discord.js');
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
client.once(Events.ClientReady, async c => {
	// Membuat data array untuk daftar Commands
	const commands = []
	client.commands = new Collection()
	const foldersPath = path.join(__dirname, 'commands');
	const commandFolders = fs.readdirSync(foldersPath);

	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);
			// Set a new item in the Collection with the key as the command name and the value as the exported module
			if ('data' in command && 'execute' in command) {
				client.commands.set(command.data.name, command);
				commands.push({
					name: command.data.name,
					description: command.data.description
				})
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}
	
	// Mendaftarkan daftar Commands ke Discord API
	const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
	try {
		console.log('Started refreshing application (/) commands.');
		await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}

	console.log(`Ready! Logged in as ${c.user.tag}`);
})

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// Obrolan dengan ChatGPT
client.on('messageCreate', async (message) => {
	if (message.author.bot) return
	if (message.channel.id !== process.env.CHANNEL_ID) return
	
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