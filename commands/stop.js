module.exports = {
  name: 'stop',
  description: 'Stop playing and clear the queue',
  async execute(message, args, client) {
    const queue = client.distube.getQueue(message.guildId);
    
    if (!queue) {
      return message.reply('There is nothing playing right now!');
    }
    
    queue.stop();
    message.reply('⏹️ Stopped the music and cleared the queue!');
  }
};