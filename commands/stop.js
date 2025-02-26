const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'stop',
  description: 'Stop playing music and clear the queue',
  execute(message, args, client) {
    const player = client.manager.get(message.guild.id);
    
    // Check if there is a player
    if (!player) {
      return message.reply('No music is currently playing!');
    }
    
    // Check if the user is in the same voice channel
    const { channel } = message.member.voice;
    if (!channel || channel.id !== player.voiceChannel) {
      return message.reply('You need to be in the same voice channel as the bot to stop music!');
    }
    
    // Clear the queue and stop the player
    player.queue.clear();
    player.stop();
    
    // Create an embed for the response
    const embed = new EmbedBuilder()
      .setTitle('Music Stopped')
      .setDescription('Stopped playing music and cleared the queue.')
      .setColor('#FF0000')
      .setTimestamp();
    
    message.channel.send({ embeds: [embed] });
    
    // Option to destroy the player completely
    if (args[0] === "leave") {
      player.destroy();
      embed.setDescription('Stopped playing music, cleared the queue, and left the voice channel.');
      message.channel.send({ embeds: [embed] });
    }
  },
};