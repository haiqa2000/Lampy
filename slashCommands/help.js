const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Change the player volume')
    .addIntegerOption(option => 
      option.setName('level')
        .setDescription('The volume level (0-100)')
        .setMinValue(0)
        .setMaxValue(100)
        .setRequired(false)),
  
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    
    // Check if there is a queue
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
        content: 'You need to be in the same voice channel as the bot to change volume!',
        ephemeral: true 
      });
    }
    
    // Get the volume from options
    const volume = interaction.options.getInteger('level');
    
    // If no volume specified, return current volume
    if (volume === null) {
      return interaction.reply(`The current volume is: **${queue.volume}%**`);
    }
    
    // Set the volume
    queue.setVolume(volume);
    
    // Create an embed for the response
    const embed = new EmbedBuilder()
      .setTitle('Volume Changed')
      .setDescription(`Volume set to: **${volume}%**`)
      .setColor('#0099FF')
      .setTimestamp();
    
    interaction.reply({ embeds: [embed] });
  },
};