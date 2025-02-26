const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'pause',
  description: 'Pause or resume the currently playing music',
  execute(message, args, client) {
    const player = client.manager.get(message.guild.id);
    
    // Check if there is a player and it's playing
    if (!player || !player.queue.current) {
      return message.reply('No music is currently playing!');
    }
    
    // Check if the user is in the same voice channel
    const { channel } = message.member.voice;
    if (!channel || channel.id !== player.voiceChannel) {
      return message.reply('You need to be in the same voice channel as the bot to pause/resume music!');
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
    
    message.channel.send({ embeds: [embed] });
  },
};