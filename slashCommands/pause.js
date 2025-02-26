const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause or resume the currently playing music'),
  
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    
    // Check if there is a queue and it's playing
    if (!queue) {
      return interaction.reply({ 
        content: 'No music is currently playing!',
        ephemeral: true 
      });
    }
    
    // Check if the user is in the same voice channel
    const { channel } = interaction.member.voice;
    if (!channel || channel.id !== queue.voiceChannel.id) {
      return interaction.reply({ 
        content: 'You need to be in the same voice channel as the bot to pause/resume music!',
        ephemeral: true 
      });
    }
    
    // Toggle pause state
    if (queue.paused) {
      queue.resume();
    } else {
      queue.pause();
    }
    
    // Create an embed for the response
    const embed = new EmbedBuilder()
      .setTitle(queue.paused ? 'Music Paused' : 'Music Resumed')
      .setDescription(queue.paused 
        ? `Paused [${queue.songs[0].name}](${queue.songs[0].url})` 
        : `Resumed [${queue.songs[0].name}](${queue.songs[0].url})`)
      .setColor(queue.paused ? '#FFCC00' : '#00FF00')
      .setTimestamp();
    
    interaction.reply({ embeds: [embed] });
  },
};