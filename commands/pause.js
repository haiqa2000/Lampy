const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'pause',
  description: 'Pause the currently playing music',
  execute(message, args, client) {
    const queue = client.distube.getQueue(message.guildId);
    
    // Check if there is a queue and it's playing
    if (!queue || !queue.songs[0]) {
      return message.reply('No music is currently playing!');
    }
    
    // Check if the user is in the same voice channel
    const { channel } = message.member.voice;
    if (!channel || queue.voiceChannel.id !== channel.id) {
      return message.reply('You need to be in the same voice channel as the bot to pause music!');
    }
    
    // Check if already paused
    if (queue.paused) {
      return message.reply('The music is already paused! Use `!resume` to resume playback.');
    }
    
    // Pause the queue
    queue.pause();
    
    // Create an embed for the response
    const embed = new EmbedBuilder()
      .setTitle('Music Paused')
      .setDescription(`Paused [${queue.songs[0].name}](${queue.songs[0].url})`)
      .setColor('#FFCC00')
      .setTimestamp();
    
    message.channel.send({ embeds: [embed] });
  },
};