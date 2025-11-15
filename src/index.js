require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require('discord.js');
const catalog = require('./catalog');
const audio = require('./audio');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Create Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Define slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a track by ID')
    .addStringOption(option =>
      option.setName('track')
        .setDescription('Track ID to play')
        .setRequired(true)
        .setAutocomplete(true)),
  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playback and leave voice channel'),
  new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search tracks by tags')
    .addStringOption(option =>
      option.setName('tags')
        .setDescription('Comma-separated tags (e.g., battle,intense)')
        .setRequired(false)),
  new SlashCommandBuilder()
    .setName('reloadtracks')
    .setDescription('Reload the track catalog from disk'),
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if bot is responsive'),
  new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show currently playing track'),
].map(command => command.toJSON());

// Register slash commands (guild-specific for instant updates)
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('Registering slash commands...');

    // Clear global commands (removes duplicates)
    await rest.put(Routes.applicationCommands(client.user.id), { body: [] });
    console.log('Cleared global commands');

    // Register to all guilds the bot is in (instant, no 1-hour delay)
    const guilds = client.guilds.cache;
    for (const [guildId, guild] of guilds) {
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guildId),
        { body: commands }
      );
      console.log(`Registered commands in guild: ${guild.name}`);
    }

    console.log('Slash commands registered successfully');
  } catch (error) {
    console.error('Failed to register slash commands:', error);
  }
}

// Bot ready event
client.once('ready', async () => {
  console.log(`Bot is online! Logged in as ${client.user.tag}`);

  // Load track catalog on startup
  catalog.load();

  // Register slash commands
  await registerCommands();
});

// Slash command handler
client.on('interactionCreate', async (interaction) => {
  // Handle autocomplete
  if (interaction.isAutocomplete()) {
    const focusedOption = interaction.options.getFocused(true);

    if (interaction.commandName === 'play' && focusedOption.name === 'track') {
      const query = focusedOption.value.toLowerCase();

      // Filter tracks by ID or name matching the query
      const filtered = catalog.tracks
        .filter(track =>
          track.id.toLowerCase().includes(query) ||
          track.name.toLowerCase().includes(query)
        )
        .slice(0, 25) // Discord limits to 25 choices
        .map(track => ({
          name: `${track.name} [${track.tags.join(', ')}]`,
          value: track.id,
        }));

      await interaction.respond(filtered);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // /ping command
  if (commandName === 'ping') {
    await interaction.reply('Pong!');
  }

  // /search command
  if (commandName === 'search') {
    const tagString = interaction.options.getString('tags');
    if (!tagString) {
      await interaction.reply(`Found ${catalog.count} total tracks. Use \`/search tags:battle,intense\` to filter.`);
      return;
    }

    const tags = tagString.split(',').map(tag => tag.trim()).filter(tag => tag);
    const results = catalog.searchByTags(tags);
    const formatted = catalog.formatSearchResults(results);
    await interaction.reply(formatted);
  }

  // /reloadtracks command
  if (commandName === 'reloadtracks') {
    await interaction.deferReply();

    // Get the path to build_tracks.py (one level up from src/)
    const scriptPath = path.join(__dirname, '..', 'build_tracks.py');

    // Run the Python script first
    exec(`python "${scriptPath}"`, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        console.error('Failed to run build_tracks.py:', error);
        interaction.editReply(`Failed to rebuild track catalog: ${error.message}`);
        return;
      }

      if (stderr) {
        console.error('build_tracks.py stderr:', stderr);
      }

      console.log('build_tracks.py output:', stdout);

      // Now reload the catalog
      const success = catalog.reload();
      if (success) {
        interaction.editReply(`Rebuilt and reloaded track catalog. ${catalog.count} tracks loaded.`);
      } else {
        interaction.editReply('Script ran but failed to reload catalog. Check console for errors.');
      }
    });
  }

  // /play command
  if (commandName === 'play') {
    // Defer immediately to prevent timeout
    await interaction.deferReply();

    const trackId = interaction.options.getString('track');

    // Check if user is in a voice channel
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      await interaction.editReply('You must be in a voice channel to play music.');
      return;
    }

    // Look up track in catalog
    const track = catalog.getById(trackId);
    if (!track) {
      await interaction.editReply(`Track not found: \`${trackId}\``);
      return;
    }

    // Verify file exists
    if (!fs.existsSync(track.file)) {
      await interaction.editReply(`Audio file not found on disk: ${track.file}`);
      return;
    }

    try {
      // Join voice channel if not already connected
      if (!audio.isConnected) {
        await audio.join(voiceChannel);
      }

      // Play the track
      await audio.play(track.file, track);
      await interaction.editReply(`Now playing: **${track.name}** [${track.tags.join(', ')}]`);
    } catch (error) {
      console.error('Playback error:', error);
      await interaction.editReply(`Failed to play track: ${error.message}`);
    }
  }

  // /stop command
  if (commandName === 'stop') {
    if (!audio.isConnected) {
      await interaction.reply({ content: 'Not currently playing anything.', ephemeral: true });
      return;
    }

    audio.stop();
    await interaction.reply('Stopped playback and left voice channel.');
  }

  // /nowplaying command
  if (commandName === 'nowplaying') {
    if (!audio.isConnected) {
      await interaction.reply({ content: 'Not connected to a voice channel.', ephemeral: true });
      return;
    }

    const track = audio.currentTrack;
    if (track && audio.isPlaying) {
      await interaction.reply(`Now playing: **${track.name}** [${track.tags.join(', ')}]`);
    } else {
      await interaction.reply('Nothing is currently playing.');
    }
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down bot...');
  audio.cleanup();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down bot...');
  audio.cleanup();
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

console.log('Logging in to Discord...');
client.login(token).catch(error => {
  console.error('Failed to login:', error);
  process.exit(1);
});
