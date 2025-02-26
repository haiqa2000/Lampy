const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube, Spotify, or SoundCloud')
    .addStringOption(option => 
      option.setName('query')
        .setDescription('The song name or URL to play')
        .setRequired(true)),
  
  async execute(interaction, client) {
    await interaction.deferReply();
    
    const query = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice.channel;
    
    if (!voiceChannel) {
      return interaction.followUp('You need to be in a voice channel to use music commands!');
    }
    
    try {
      await client.distube.play(voiceChannel, query, {
        member: interaction.member,
        textChannel: interaction.channel,
        interaction
      });
      
      await interaction.followUp(`🔍 Searching for: \`${query}\``);
    } catch (error) {
      console.error(error);
      await interaction.followUp(`Error: ${error.message.slice(0, 1000) || 'Unknown error occurred'}`);
    }
  }
};