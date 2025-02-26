const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show detailed information about the currently playing song'),
  
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    
    // Check if there is a queue and it's playing
    if (!queue || !queue.songs || queue.songs.length === 0) {
      return interaction.reply({ 
        content: 'No music is currently playing!',
        ephemeral: true 
      });
    }
    
    // Get the current track
    const track = queue.songs[0];
    
    // Calculate the progress bar
    const duration = track.duration * 1000; // Convert to ms
    const position = queue.currentTime * 1000; // Convert to ms
    const progress = createProgressBar(position, duration);
    
    // Format timestamps
    const positionTimestamp = formatDuration(position);
    const durationTimestamp = formatDuration(duration);
    
    // Create an embed for the response
    const embed = new EmbedBuilder()
      .setTitle('Now Playing')
      .setDescription(`[${track.name}](${track.url})`)
      .addFields(
        { name: 'Duration', value: `${positionTimestamp} ${progress} ${durationTimestamp}`, inline: false },
        { name: 'Requested By', value: `<@${track.user.id}>`, inline: true },
        { name: 'Volume', value: `${queue.volume}%`, inline: true },
        { name: 'Queue Length', value: `${queue.songs.length} song(s)`, inline: true }
      )
      .setThumbnail(track.thumbnail || 'https://i.imgur.com/4M7IWwP.png')
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
    
    interaction.reply({ embeds: [embed], components: [row] }).then(() => {
      // Store the message ID for later reference
      client.nowPlayingMessages = client.nowPlayingMessages || new Map();
      
      // Record this as the latest nowplaying message for this guild
      client.nowPlayingMessages.set(interaction.guildId, {
        channelId: interaction.channelId,
        messageId: interaction.id // For interactions, this is the interaction ID
      });
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