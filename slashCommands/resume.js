const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the currently paused music'),
  
  async execute(interaction, client) {
    // Defer reply to have time to process
    await interaction.deferReply();
    
    const queue = client.distube.getQueue(interaction.guildId);
    
    // Check if there is a queue and it's playing
    if (!queue || !queue.songs[0]) {
      return interaction.editReply('No music is currently playing!');
    }
    
    // Check if the user is in the same voice channel
    const { channel } = interaction.member.voice;
    if (!channel || queue.voiceChannel.id !== channel.id) {
      return interaction.editReply('You need to be in the same voice channel as the bot to resume music!');
    }
    
    // Check if already playing
    if (!queue.paused) {
      return interaction.editReply('The music is already playing!');
    }
    
    // Resume the queue
    queue.resume();
    
    // Create an embed for the response
    const embed = new EmbedBuilder()
      .setTitle('Music Resumed')
      .setDescription(`Resumed [${queue.songs[0].name}](${queue.songs[0].url})`)
      .setColor('#00FF00')
      .setTimestamp();
    
    // Send the embed
    interaction.editReply({ embeds: [embed] });
  },
};