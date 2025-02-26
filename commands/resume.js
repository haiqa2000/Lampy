const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'resume',
  description: 'Resume the currently paused music',
  execute(message, args, client) {
    const queue = client.distube.getQueue(message.guildId);
    
    // Check if there is a queue and it's playing
    if (!queue || !queue.songs[0]) {
      return message.reply('No music is currently playing!');
    }
    
    // Check if the user is in the same voice channel
    const { channel } = message.member.voice;
    if (!channel || queue.voiceChannel.id !== channel.id) {
      return message.reply('You need to be in the same voice channel as the bot to resume music!');
    }
    
    // Check if already playing
    if (!queue.paused) {
      return message.reply('The music is already playing!');
    }
    
    // Resume the queue
    queue.resume();
    
    // Create an embed for the response
    const embed = new EmbedBuilder()
      .setTitle('Music Resumed')
      .setDescription(`Resumed [${queue.songs[0].name}](${queue.songs[0].url})`)
      .setColor('#00FF00')
      .setTimestamp();
    
    message.channel.send({ embeds: [embed] });
  },
};