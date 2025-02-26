const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause or resume the currently playing music'),
  
  async execute(interaction, client) {
    const player = client.manager.get(interaction.guild.id);
    
    // Check if there is a player and it's playing
    if (!player || !player.queue.current) {
      return interaction.reply({ 
        content: 'No music is currently playing!',
        ephemeral: true 
      });
    }
    
    // Check if the user is in the same voice channel
    const { channel } = interaction.member.voice;
    if (!channel || channel.id !== player.voiceChannel) {
      return interaction.reply({ 
        content: 'You need to be in the same voice channel as the bot to pause/resume music!',
        ephemeral: true 
      });
    }
    
    // Toggle pause state
    player.pause(!player.paused);
    
    // Create an embed for the response
    const embed = new EmbedBuilder()
      .setTitle(player.paused ? 'Music Paused' : 'Music Resumed')
      .setDescription(player.paused 
        ? `Paused [${player.queue.current.title}](${player.queue.current.uri})` 
        : `Resumed [${player.queue.current.title}](${player.queue.current.uri})`)
      .setColor(player.paused ? '#FFCC00' : '#00FF00')
      .setTimestamp();
    
    interaction.reply({ embeds: [embed] });
  },
};