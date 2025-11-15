require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

// Create Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const PREFIX = '!';

// Bot ready event
client.once('ready', () => {
  console.log(`Bot is online! Logged in as ${client.user.tag}`);
});

// Message handler
client.on('messageCreate', async (message) => {
  // Ignore bot messages and messages without prefix
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // !ping command
  if (command === 'ping') {
    await message.reply('Pong!');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down bot...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down bot...');
  client.destroy();
  process.exit(0);
});

// Login to Discord
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('Error: DISCORD_TOKEN not found in environment variables');
  console.error('Please create a .env file with your bot token');
  process.exit(1);
}

client.login(token);
