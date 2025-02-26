module.exports = {
  name: 'skip',
  description: 'Skip the current song',
  async execute(message, args, client) {
    const queue = client.distube.getQueue(message.guildId);
    
    if (!queue) {
      return message.reply('There is nothing playing right now!');
    }
    
    try {
      await queue.skip();
      message.reply('⏭️ Skipped the current song!');
    } catch (error) {
      message.reply(`Cannot skip! ${error}`);
    }
  }
};