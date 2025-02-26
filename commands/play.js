module.exports = {
  name: 'play',
  description: 'Play a song from YouTube, Spotify, or SoundCloud',
  async execute(message, args, client) {
    if (!args.length) {
      return message.reply('You need to provide a song name or URL to play!');
    }
    
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply('You need to be in a voice channel to use music commands!');
    }
    
    const query = args.join(' ');
    
    try {
      await client.distube.play(voiceChannel, query, {
        member: message.member,
        textChannel: message.channel,
        message
      });
    } catch (error) {
      console.error(error);
      message.reply(`Error: ${error.message.slice(0, 1000) || 'Unknown error occurred'}`);
    }
  }
};