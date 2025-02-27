const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'volume',
  description: 'Change the player volume',
  execute(message, args, client) {
    const queue = client.distube.getQueue(message.guildId);
    
    // Check if there is a queue
    if (!queue) {
      return message.reply('No music is currently playing!');
    }
    
    // Check if the user is in the same voice channel
    const { channel } = message.member.voice;
    if (!channel || queue.voiceChannel.id !== channel.id) {
      return message.reply('You need to be in the same voice channel as the bot to change volume!');
    }
    
    // If no args, return current volume
    if (!args.length) {
      return message.reply(`The current volume is: **${queue.volume}%**`);
    }
    
    // Get the volume
    const volume = Number(args[0]);
    
    // Check if the volume is valid
    if (isNaN(volume) || volume < 0 || volume > 100) {
      return message.reply('Please provide a valid volume between 0 and 100.');
    }
    
    // Set the volume
    queue.setVolume(volume);
    
    // Create an embed for the response
    const embed = new EmbedBuilder()
      .setTitle('Volume Changed')
      .setDescription(`Volume set to: **${volume}%**`)
      .setColor('#0099FF')
      .setTimestamp();
    
    message.channel.send({ embeds: [embed] });
  },
};