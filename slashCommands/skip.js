const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),
  
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
        content: 'You need to be in the same voice channel as the bot to skip music!',
        ephemeral: true 
      });
    }
    
    // Store the current track to show in the response
    const currentTrack = player.queue.current;
    
    // Skip the current track
    player.stop();
    
    // Create an embed for the response
    const embed = new EmbedBuilder()
      .setTitle('Skipped Song')
      .setDescription(`Skipped [${currentTrack.title}](${currentTrack.uri})`)
      .setColor('#FFCC00')
      .setTimestamp();
    
    interaction.reply({ embeds: [embed] });
  },
};