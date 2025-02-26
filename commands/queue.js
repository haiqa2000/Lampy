module.exports = {
  name: 'queue',
  description: 'Display the current music queue',
  async execute(message, args, client) {
    const queue = client.distube.getQueue(message.guildId);
    
    if (!queue || !queue.songs.length) {
      return message.reply('There is nothing in the queue right now!');
    }
    
    const queueList = queue.songs
      .slice(0, 10)
      .map((song, index) => 
        `${index === 0 ? '**Now Playing:**' : `**${index}.**`} [${song.name}](${song.url}) - \`${formatDuration(song.duration * 1000)}\``
      )
      .join('\n');
    
    const totalSongs = queue.songs.length - 1;
    const totalDuration = formatDuration(
      queue.songs.reduce((acc, song) => acc + song.duration * 1000, 0)
    );
    
    const { EmbedBuilder } = require('discord.js');
    const embed = new EmbedBuilder()
      .setTitle('Music Queue')
      .setDescription(`${queueList}\n\n${totalSongs > 10 ? `\nAnd ${totalSongs - 10} more song(s)` : ''}\n\n**Total Duration:** \`${totalDuration}\``)
      .setColor('#0099FF')
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
    
    function formatDuration(ms) {
      const seconds = Math.floor((ms / 1000) % 60);
      const minutes = Math.floor((ms / 1000 / 60) % 60);
      const hours = Math.floor(ms / 1000 / 60 / 60);
    
      return hours > 0
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
};