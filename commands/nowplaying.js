const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: 'nowplaying',
  aliases: ['np', 'current'],
  description: 'Show detailed information about the currently playing song',
  execute(message, args, client) {
    const queue = client.distube.getQueue(message.guildId);
    
    // Check if there is a queue and it's playing
    if (!queue || !queue.songs[0]) {
      return message.reply('No music is currently playing!');
    }
    
    // Get the current song
    const song = queue.songs[0];
    
    // Calculate the progress bar
    const duration = song.duration * 1000; // DisTube uses seconds, convert to ms for the helper function
    const position = queue.currentTime * 1000; // Convert to ms
    const progress = createProgressBar(position, duration);
    
    // Format timestamps
    const positionTimestamp = formatDuration(position);
    const durationTimestamp = formatDuration(duration);
    
    // Create an embed for the response
    const embed = new EmbedBuilder()
      .setTitle('Now Playing')
      .setDescription(`[${song.name}](${song.url})`)
      .addFields(
        { name: 'Duration', value: `${positionTimestamp} ${progress} ${durationTimestamp}`, inline: false },
        { name: 'Requested By', value: `<@${song.user.id}>`, inline: true },
        { name: 'Volume', value: `${queue.volume}%`, inline: true },
        { name: 'Queue Length', value: `${queue.songs.length - 1} song(s)`, inline: true }
      )
      .setThumbnail(song.thumbnail || 'https://i.imgur.com/4M7IWwP.png')
      .setColor('#0099FF')
      .setTimestamp();
    
    // Create buttons for control
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('pause_resume')
          .setLabel(queue.paused ? '▶️ Resume' : '⏸️ Pause')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('skip')
          .setLabel('⏭️ Skip')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('stop')
          .setLabel('⏹️ Stop')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('queue')
          .setLabel('📋 Queue')
          .setStyle(ButtonStyle.Secondary)
      );
    
    message.channel.send({ embeds: [embed], components: [row] }).then(msg => {
      // Delete the old now playing message if it exists
      const oldMessageId = client.nowPlayingMessages.get(message.guildId);
      if (oldMessageId) {
        const oldChannel = message.channel;
        if (oldChannel) {
          oldChannel.messages.fetch(oldMessageId).then(oldMsg => {
            if (oldMsg && !oldMsg.deleted) {
              oldMsg.delete().catch(() => {});
            }
          }).catch(() => {});
        }
      }
      
      // Save the new message ID
      client.nowPlayingMessages.set(message.guildId, msg.id);
    });
  },
};

// Helper functions
function createProgressBar(current, total, size = 15) {
  const percentage = current / total;
  const progress = Math.round(size * percentage);
  const emptyProgress = size - progress;
  
  const progressBar = '▇'.repeat(progress) + '—'.repeat(emptyProgress);
  
  return `[${progressBar}]`;
}

function formatDuration(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const hours = Math.floor(ms / 1000 / 60 / 60);

  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;
}