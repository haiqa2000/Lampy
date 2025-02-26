const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube or Spotify')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('The song to play (URL or search query)')
        .setRequired(true)),

  async execute(interaction, client) {
    const { channel } = interaction.member.voice;

    // Check if the user is in a voice channel
    if (!channel) {
      return interaction.reply({ 
        content: 'You need to be in a voice channel to play music!', 
        ephemeral: true 
      });
    }

    // Check bot permissions
    const permissions = channel.permissionsFor(interaction.client.user);
    if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
      return interaction.reply({ 
        content: 'I need permissions to join and speak in your voice channel!', 
        ephemeral: true 
      });
    }

    await interaction.deferReply(); // Avoids multiple reply errors

    const searchQuery = interaction.options.getString('query');

    // Ensure Lavalink node is available
    if (!client.manager.nodes.size) {
      return interaction.editReply('No Lavalink nodes are available. Please check your Lavalink server.');
    }

    // Get or create a player
    let player = client.manager.players.get(interaction.guild.id);
    if (!player) {
      player = client.manager.create({
        guild: interaction.guild.id,
        voiceChannel: channel.id,
        textChannel: interaction.channel.id,
        selfDeafen: true,
      });
    }

    // Connect to the voice channel
    if (!player.connected) {
      player.connect();
    }

    // Search for the song
    let res;
    try {
      res = await player.search(searchQuery, interaction.user);
      if (res.loadType === "LOAD_FAILED") throw res.exception;
      if (res.loadType === "NO_MATCHES") {
        return interaction.editReply(`No matches found for: **${searchQuery}**`);
      }
    } catch (err) {
      return interaction.editReply(`An error occurred while searching: **${err.message}**`);
    }

    // Handle different result types
    let embed;
    if (res.loadType === "TRACK_LOADED" || res.loadType === "SEARCH_RESULT") {
      player.queue.add(res.tracks[0]);

      embed = new EmbedBuilder()
        .setTitle('Added to Queue')
        .setDescription(`[${res.tracks[0].title}](${res.tracks[0].uri})`)
        .setColor('#00FF00')
        .setTimestamp();

    } else if (res.loadType === "PLAYLIST_LOADED") {
      res.tracks.forEach(track => player.queue.add(track));

      embed = new EmbedBuilder()
        .setTitle('Playlist Added to Queue')
        .setDescription(`**${res.playlist.name}** with **${res.tracks.length}** tracks`)
        .setColor('#00FF00')
        .setTimestamp();
    }

    await interaction.editReply({ embeds: [embed] });

    // Start playing if nothing is playing
    if (!player.playing && !player.paused) {
      player.play();
    }
  }
};
