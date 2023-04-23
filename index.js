// Membutuhkan kelas discord.js yang diperlukan
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { config } = require("dotenv")
config()

const token = process.env.DISCORD_TOKEN;

// Buat instance klien baru
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Saat klien siap, jalankan kode ini (hanya sekali)
// Kami menggunakan 'c' untuk parameter acara agar tetap terpisah dari 'klien' yang sudah ditentukan
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Masuk ke Discord dengan token klien Anda
client.login(token);