const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'play',
  description: 'Play a song from YouTube or Spotify',
  async execute(message, args, client) {
    const { channel } = message.member.voice;

    if (!channel) {
      return message.reply('You need to be in a voice channel to play music!');
    }

    const permissions = channel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
      return message.reply('I need permissions to join and speak in your voice channel!');
    }

    if (!args.length) {
      return message.reply('Please provide a song to play!');
    }

    const searchQuery = args.join(' ');
    console.log(`Executing play command: ${searchQuery}`);

    // Check if a player already exists
    let player = client.manager.players.get(message.guild.id);
    if (!player) {
      player = client.manager.create({
        guild: message.guild.id,
        voiceChannel: channel.id,
        textChannel: message.channel.id,
        selfDeafen: true,
      }); 
    }

    // Ensure the player is connected before playing
    if (!player.connected) {
      try {
        player.connect();
      } catch (err) {
        console.error("Error connecting:", err);
        return message.reply("Failed to connect to the voice channel.");
      }
    }


    // Connect to the voice channel if not connected
    if (player.state !== "CONNECTED") {
      player.connect();
    }

    let res;
    try {
      res = await player.search(search, message.author);
      
      if (res.loadType === "LOAD_FAILED") {
        console.error("Search Load Failed:", res.exception);
        return message.reply(`Error: ${res.exception.message}`);
      }
    
      if (res.loadType === "NO_MATCHES") {
        return message.reply(`No matches found for: ${search}`);
      }
    } catch (err) {
      console.error("Search Error:", err);
      return message.reply("An unexpected error occurred while searching.");
    }
    

    switch (res.loadType) {
      case "TRACK_LOADED":
        player.queue.add(res.tracks[0]);
        message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('Added to Queue')
              .setDescription(`[${res.tracks[0].title}](${res.tracks[0].uri})`)
              .setColor('#00FF00')
              .setTimestamp()
          ]
        });

        if (!player.playing && !player.paused && !player.queue.size) {
          player.play();
        }
        break;

      case "PLAYLIST_LOADED":
        player.queue.add(res.tracks);
        message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('Playlist Added to Queue')
              .setDescription(`**${res.playlist.name}** with ${res.tracks.length} tracks`)
              .setColor('#00FF00')
              .setTimestamp()
          ]
        });

        if (!player.playing && !player.paused && player.queue.totalSize === res.tracks.length) {
          player.play();
        }
        break;

      case "SEARCH_RESULT":
        player.queue.add(res.tracks[0]);
        message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('Added to Queue')
              .setDescription(`[${res.tracks[0].title}](${res.tracks[0].uri})`)
              .setColor('#00FF00')
              .setTimestamp()
          ]
        });

        if (!player.playing && !player.paused && !player.queue.size) {
          player.play();
        }
        break;
    }
  },
};
