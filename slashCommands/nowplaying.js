const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show detailed information about the currently playing song'),
  
  async execute(interaction, client) {
    const player = client.manager.get(interaction.guild.id);
    
    // Check if there is a player and it's playing
    if (!player || !player.queue.current) {
      return interaction.reply({ 
        content: 'No music is currently playing!',
        ephemeral: true 
      });
    }
    
    // Get the current track
    const track = player.queue.current;
    
    // Calculate the progress bar
    const duration = track.duration;
    const position = player.position;
    const progress = createProgressBar(position, duration);
    
    // Format timestamps
    const positionTimestamp = formatDuration(position);
    const durationTimestamp = formatDuration(duration);
    
    // Create an embed for the response
    const embed = new EmbedBuilder()
      .setTitle('Now Playing')
      .setDescription(`[${track.title}](${track.uri})`)
      .addFields(
        { name: 'Duration', value: `${positionTimestamp} ${progress} ${durationTimestamp}`, inline: false },
        { name: 'Requested By', value: `<@${track.requester.id}>`, inline: true },
        { name: 'Volume', value: `${player.volume}%`, inline: true },
        { name: 'Queue Length', value: `${player.queue.length} song(s)`, inline: true }
      )
      .setThumbnail(track.thumbnail || 'https://i.imgur.com/4M7IWwP.png')
      .setColor('#0099FF')
      .setTimestamp();
    
    // Create buttons for control
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('pause_resume')
          .setLabel(player.paused ? '▶️ Resume' : '⏸️ Pause')
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
    
    interaction.reply({ embeds: [embed], components: [row] }).then(() => {
      // Delete the old now playing message if it exists
      const oldMessageId = player.get('nowPlayingMessage');
      if (oldMessageId) {
        const oldChannel = client.channels.cache.get(player.textChannel);
        if (oldChannel) {
          oldChannel.messages.fetch(oldMessageId).then(oldMsg => {
            if (oldMsg && !oldMsg.deleted) {
              oldMsg.delete().catch(() => {});
            }
          }).catch(() => {});
        }
      }
      
      // We can't save interaction replies as now playing messages
      // because they have different behavior from regular messages
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