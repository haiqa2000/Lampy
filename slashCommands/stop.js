const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playing and clear the queue'),
  
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    
    if (!queue) {
      return interaction.reply('There is nothing playing right now!');
    }
    
    queue.stop();
    interaction.reply('⏹️ Stopped the music and cleared the queue!');
  }
};