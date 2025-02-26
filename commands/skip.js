const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'skip',
  description: 'Skip the current song',
  execute(message, args, client) {
    const player = client.manager.get(message.guild.id);
    
    // Check if there is a player and it's playing
    if (!player || !player.queue.current) {
      return message.reply('No music is currently playing!');
    }
    
    // Check if the user is in the same voice channel
    const { channel } = message.member.voice;
    if (!channel || channel.id !== player.voiceChannel) {
      return message.reply('You need to be in the same voice channel as the bot to skip music!');
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
    
    message.channel.send({ embeds: [embed] });
  },
};