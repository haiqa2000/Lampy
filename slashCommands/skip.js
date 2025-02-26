const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),
  
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    
    if (!queue) {
      return interaction.reply('There is nothing playing right now!');
    }
    
    try {
      await queue.skip();
      interaction.reply('⏭️ Skipped the current song!');
    } catch (error) {
      interaction.reply(`Cannot skip! ${error}`);
    }
  }
};