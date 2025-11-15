const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
} = require('@discordjs/voice');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');

class AudioManager {
  constructor() {
    this.connection = null;
    this.player = null;
    this.currentGuildId = null;
  }

  /**
   * Join a voice channel
   * @param {VoiceChannel} channel - Discord voice channel to join
   * @returns {VoiceConnection} The voice connection
   */
  async join(channel) {
    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    this.currentGuildId = channel.guild.id;

    // Wait for connection to be ready
    try {
      await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
      console.log(`Joined voice channel: ${channel.name}`);
    } catch (error) {
      this.connection.destroy();
      this.connection = null;
      throw new Error('Failed to join voice channel within 30 seconds');
    }

    // Create audio player
    this.player = createAudioPlayer();
    this.connection.subscribe(this.player);

    // Handle connection disconnect
    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
        // Seems to be reconnecting
      } catch (error) {
        // Disconnected and not reconnecting
        this.cleanup();
      }
    });

    return this.connection;
  }

  /**
   * Play an audio file
   * @param {string} filePath - Absolute path to the audio file
   * @returns {Promise} Resolves when playback starts
   */
  async play(filePath) {
    if (!this.connection || !this.player) {
      throw new Error('Not connected to a voice channel');
    }

    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`);
    }

    console.log(`Starting FFmpeg for: ${filePath}`);

    // Create FFmpeg process to convert audio to PCM
    const ffmpeg = spawn(ffmpegPath, [
      '-i', filePath,
      '-analyzeduration', '0',
      '-loglevel', '0',
      '-f', 's16le',
      '-ar', '48000',
      '-ac', '2',
      'pipe:1',
    ]);

    ffmpeg.on('error', (error) => {
      console.error('FFmpeg spawn error:', error);
    });

    ffmpeg.stderr.on('data', (data) => {
      console.error('FFmpeg stderr:', data.toString());
    });

    ffmpeg.on('close', (code) => {
      console.log(`FFmpeg process exited with code ${code}`);
    });

    // Create audio resource from FFmpeg output
    const resource = createAudioResource(ffmpeg.stdout, {
      inputType: 'raw',
      inlineVolume: false,
    });

    console.log('Audio resource created, playing...');

    // Play the resource
    this.player.play(resource);

    // Wait for playback to start
    return new Promise((resolve, reject) => {
      this.player.once(AudioPlayerStatus.Playing, () => {
        console.log(`Now playing: ${filePath}`);
        resolve();
      });

      this.player.once('error', (error) => {
        console.error('Audio player error:', error);
        reject(error);
      });

      // Timeout if playback doesn't start
      setTimeout(() => {
        reject(new Error('Playback failed to start within 10 seconds'));
      }, 10000);
    });
  }

  /**
   * Stop playback and leave voice channel
   */
  stop() {
    if (this.player) {
      this.player.stop();
    }
    this.cleanup();
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
    this.player = null;
    this.currentGuildId = null;
    console.log('Left voice channel');
  }

  /**
   * Check if currently playing
   */
  get isPlaying() {
    return this.player && this.player.state.status === AudioPlayerStatus.Playing;
  }

  /**
   * Check if connected to voice
   */
  get isConnected() {
    return this.connection !== null;
  }
}

module.exports = new AudioManager();
