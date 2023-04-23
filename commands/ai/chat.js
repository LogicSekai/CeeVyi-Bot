const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs')
const { Configuration, OpenAIApi } = require("openai")
const identity = fs.readFileSync('./characterConfig/identity.txt')
let promptNeuro = identity.toString()

// Membuat Koneksi ke OpenAi
const configuration = new Configuration({
	organization: process.env.ORG_KEY_GPT,
    apiKey: process.env.API_KEY_GPT,
});

const openai = new OpenAIApi(configuration)

async function chatWithGPT(prompt) {
    const result = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: promptNeuro + "Q:" + prompt,
        temperature: 0.9,
        max_tokens: 150,
        top_p: 1,
        frequency_penalty: 0.0,
        presence_penalty: 0.6,
        stop: [" Q:", " A:"],
    })
    var ms = result.data.choices[0].text.replace('?', '')
    let cut = ms.indexOf('A:')
    promptNeuro = promptNeuro + "Q:" + prompt + ms
    fs.writeFileSync('./characterConfig/identity.txt', promptNeuro)
	return ms.substr(cut + 3)
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('chat')
        .setDescription('Chatting with CeeVyi!')
        .addStringOption(option => 
            option.setName('message')
                .setDescription('Apa yang ingin kamu tanyakan?')
                .setRequired(true)),
    async execute(interaction) {
        // Obrolan dengan ChatGPT
        await interaction.channel.sendTyping();
        await interaction.deferReply();

        let responGPT = await chatWithGPT(interaction.options.getString('message'))
		await interaction.followUp(responGPT);
	},
};

