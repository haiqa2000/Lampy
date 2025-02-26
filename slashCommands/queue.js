const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current music queue'),
  
  async execute(interaction, client) {
    const player = client.manager.get(interaction.guild.id);
    
    if (!player || !player.queue.current) {
      return interaction.reply({ 
        content: 'No music is currently playing!',
        ephemeral: true 
      });
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
    
    interaction.reply({ embeds: [embed] });
  },
};

// Helper function for both commands
function formatDuration(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const hours = Math.floor(ms / 1000 / 60 / 60);

  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;
}