const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands')
    .addStringOption(option => 
      option.setName('command')
        .setDescription('Get info about a specific command')
        .setRequired(false)),
  
  async execute(interaction, client) {
    const prefix = "!";
    const commandName = interaction.options.getString('command');
    
    // If a specific command is requested
    if (commandName) {
      const command = client.slashCommands.get(commandName) || 
                      client.commands.get(commandName) || 
                      client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
      
      if (!command) {
        return interaction.reply({ 
          content: `Could not find command \`${commandName}\``,
          ephemeral: true 
        });
      }
      
      const embed = new EmbedBuilder()
        .setTitle(`Command: ${command.data ? `/${command.data.name}` : `${prefix}${command.name}`}`)
        .setDescription(command.description || command.data?.description || 'No description provided')
        .setColor('#0099FF')
        .setTimestamp();
      
      if (command.aliases && command.aliases.length) {
        embed.addFields({ name: 'Aliases', value: command.aliases.map(alias => `\`${prefix}${alias}\``).join(', '), inline: false });
      }
      
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    // General help - show all commands
    const embed = new EmbedBuilder()
      .setTitle('Music Bot Commands')
      .setDescription('Here are all available commands.')
      .setColor('#0099FF')
      .setTimestamp()
      .setFooter({ text: 'Use /help [command] for detailed info on a specific command' });
    
    // Create categories for slash commands
    const slashCategories = {
      'Music': ['play', 'pause', 'stop', 'skip', 'volume', 'queue', 'nowplaying'],
      'Utility': ['help']
    };
    
    // Add fields for each slash command category
    for (const [category, commands] of Object.entries(slashCategories)) {
      const commandList = commands
        .filter(cmd => client.slashCommands.has(cmd))
        .map(cmd => `\`/${cmd}\``)
        .join(', ');
      
      if (commandList.length) {
        embed.addFields({ name: `${category} (Slash Commands)`, value: commandList, inline: false });
      }
    }
    
    // Add info about prefix commands
    embed.addFields({ 
      name: 'Prefix Commands', 
      value: `This bot also supports prefix commands starting with \`${prefix}\`. Type \`${prefix}help\` for more information.`, 
      inline: false 
    });
    
    interaction.reply({ embeds: [embed], ephemeral: true });
  },
};