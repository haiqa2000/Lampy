const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  description: 'Show all available commands',
  execute(message, args, client) {
    const prefix = "!";
    
    // If a specific command is requested
    if (args.length) {
      const commandName = args[0].toLowerCase();
      const command = client.commands.get(commandName) || 
                      client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
      
      if (!command) {
        return message.reply(`Could not find command \`${commandName}\``);
      }
      
      const embed = new EmbedBuilder()
        .setTitle(`Command: ${prefix}${command.name}`)
        .setDescription(command.description || 'No description provided')
        .setColor('#0099FF')
        .addFields(
          { name: 'Usage', value: `\`${prefix}${command.name} ${command.usage || ''}\``, inline: false }
        )
        .setTimestamp();
      
      if (command.aliases && command.aliases.length) {
        embed.addFields({ name: 'Aliases', value: command.aliases.map(alias => `\`${prefix}${alias}\``).join(', '), inline: false });
      }
      
      return message.channel.send({ embeds: [embed] });
    }
    
    // General help - show all commands
    const embed = new EmbedBuilder()
      .setTitle('Music Bot Commands')
      .setDescription(`Here are all available commands.\nPrefix: \`${prefix}\``)
      .setColor('#0099FF')
      .setTimestamp()
      .setFooter({ text: `Type ${prefix}help [command] for detailed info on a command` });
    
    // Create categories
    const categories = {
      'Music': ['play', 'pause', 'stop', 'skip', 'volume', 'queue', 'nowplaying'],
      'Utility': ['help']
    };
    
    // Add fields for each category
    for (const [category, commands] of Object.entries(categories)) {
      const commandList = commands
        .filter(cmd => client.commands.has(cmd))
        .map(cmd => `\`${prefix}${cmd}\``)
        .join(', ');
      
      if (commandList.length) {
        embed.addFields({ name: category, value: commandList, inline: false });
      }
    }
    
    // Add slash commands information
    embed.addFields({ 
      name: 'Slash Commands', 
      value: 'This bot also supports slash commands. Type `/` to see available commands.', 
      inline: false 
    });
    
    message.channel.send({ embeds: [embed] });
  },
};