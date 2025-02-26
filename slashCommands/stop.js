const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playing music and clear the queue')
    .addBooleanOption(option =>
      option.setName('leave')
        .setDescription('Whether the bot should leave the voice channel')
        .setRequired(false)),
  
  async execute(interaction, client) {
    const player = client.manager.get(interaction.guild.id);
    
    // Check if there is a player
    if (!player) {
      return interaction.reply({ 
        content: 'No music is currently playing!',
        ephemeral: true 
      });
    }
    
    // Check if the user is in the same voice channel
    const { channel } = interaction.member.voice;
    if (!channel || channel.id !== player.voiceChannel) {
      return interaction.reply({ 
        content: 'You need to be in the same voice channel as the bot to stop music!',
        ephemeral: true 
      });
    }
    
    // Get the leave option
    const leave = interaction.options.getBoolean('leave') || false;
    
    // Clear the queue and stop the player
    player.queue.clear();
    player.stop();
    
    // Create the response message
    let description = 'Stopped playing music and cleared the queue.';
    
    // Option to destroy the player completely
    if (leave) {
      player.destroy();
      description = 'Stopped playing music, cleared the queue, and left the voice channel.';
    }
    
    // Create an embed for the response
    const embed = new EmbedBuilder()
      .setTitle('Music Stopped')
      .setDescription(description)
      .setColor('#FF0000')
      .setTimestamp();
    
    interaction.reply({ embeds: [embed] });
  },
};