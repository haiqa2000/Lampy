const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'queue',
  description: 'Show the current queue',
  execute(message, args, client) {
    const player = client.manager.get(message.guild.id);
    
    if (!player || !player.queue.current) {
      return message.reply('No music is currently playing!');
    }
    
    const queue = player.queue;
    
    // Format the current queue
    let queueList = queue.map((track, index) => 
      `${index + 1}. [${track.title}](${track.uri}) [${formatDuration(track.duration)}]`
    ).join('\n').substring(0, 2048);
    
    if (queueList.length === 0) {
      queueList = 'No upcoming songs in queue.';
    }
    
    const embed = new EmbedBuilder()
      .setTitle('Music Queue')
      .setDescription(`**Now Playing:** [${player.queue.current.title}](${player.queue.current.uri}) [${formatDuration(player.queue.current.duration)}]\n\n**Up Next:**\n${queueList}`)
      .setColor('#0099FF')
      .setTimestamp();
    
    message.channel.send({ embeds: [embed] });
  },
};
