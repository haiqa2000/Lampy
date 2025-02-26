const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { Manager } = require('erela.js');
const Spotify = require('erela.js-spotify');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Bot configuration
const config = {
  prefix: '!',
  clientId: process.env.CLIENT_ID, 
  token: process.env.TOKEN,        
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,    
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET 
  },
  nodes: [
    {
      host: process.env.LAVALINK_HOST || 'lavalink.jirayu.net',
      port: parseInt(process.env.LAVALINK_PORT) || 13592,
      password: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
      secure: process.env.LAVALINK_SECURE === 'false' || false
    }
  ]
};

// Collections for commands
client.commands = new Collection();
client.slashCommands = new Collection();

// Command handler setup
const commandsPath = path.join(__dirname, 'commands');
const slashCommandsPath = path.join(__dirname, 'slashCommands');

// Load text commands
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.name, command);
}

// Load slash commands
const slashCommandFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));
const slashCommandsArray = [];

for (const file of slashCommandFiles) {
  const filePath = path.join(slashCommandsPath, file);
  const command = require(filePath);
  client.slashCommands.set(command.data.name, command);
  slashCommandsArray.push(command.data.toJSON());
}

// Register slash commands
const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    if (config.guildId) {
      // Guild-specific command registration
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: slashCommandsArray }
      );
      console.log('Successfully registered application commands for specific guild.');
    } else {
      // Global command registration
      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: slashCommandsArray }
      );
      console.log('Successfully registered application commands globally.');
    }
  } catch (error) {
    console.error(error);
  }
})();

// Initialize Erela.js Manager (Lavalink client)
client.manager = new Manager({
  // Nodes array
  nodes: config.nodes,
  
  // Plugins
  plugins: [
    // Spotify plugin
    new Spotify({
      clientID: config.spotify.clientId,
      clientSecret: config.spotify.clientSecret
    })
  ],
  
  // Send packets to WebSocket
  send(id, payload) {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  }
});

// Utility function for creating embeds
function createEmbed(title, description, color = '#FF0000') {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
}

// Erela.js event listeners
client.manager.on("nodeConnect", node => {
  console.log(`Node "${node.options.identifier}" connected.`);
});

client.manager.on("nodeError", (node, error) => {
  console.log(`Node "${node.options.identifier}" encountered an error: ${error.message}`);
});

client.manager.on("trackStart", (player, track) => {
  const channel = client.channels.cache.get(player.textChannel);
  if (channel) {
    const embed = createEmbed('Now Playing', `[${track.title}](${track.uri})`, '#00FF00');
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('pause_resume')
          .setLabel('⏯️')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('skip')
          .setLabel('⏭️')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('stop')
          .setLabel('⏹️')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('queue')
          .setLabel('📋')
          .setStyle(ButtonStyle.Secondary)
      );
    
    channel.send({ embeds: [embed], components: [row] }).then(msg => {
      player.set('nowPlayingMessage', msg.id);
    });
  }
});

client.manager.on("queueEnd", player => {
  const channel = client.channels.cache.get(player.textChannel);
  if (channel) {
    channel.send({ embeds: [createEmbed('Queue Finished', 'No more songs in the queue.', '#FFFF00')] });
  }
  
  // Disconnect after a minute of inactivity
  setTimeout(() => {
    if (!player.playing && player.state === "CONNECTED") {
      player.destroy();
    }
  }, 60000);
});

// Discord.js event handlers
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.manager.init(client.user.id);
});

client.on('raw', d => client.manager.updateVoiceState(d));

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;
  
  if (!message.content.startsWith(config.prefix)) return;
  
  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  const command = client.commands.get(commandName);
  if (!command) return;
  
  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    message.reply('There was an error executing that command!');
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {
    // Handle button interactions (reaction controls)
    const { customId } = interaction;
    const player = client.manager.players.get(interaction.guild.id);
    
    if (!player) {
      return interaction.reply({ 
        content: 'No music is currently playing.', 
        ephemeral: true 
      });
    }
    
    switch (customId) {
      case 'pause_resume':
        player.pause(!player.paused);
        await interaction.reply({ 
          content: player.paused ? 'Paused the music.' : 'Resumed the music.',
          ephemeral: true 
        });
        break;
        
      case 'skip':
        player.stop();
        await interaction.reply({ content: 'Skipped the song.', ephemeral: true });
        break;
        
      case 'stop':
        player.destroy();
        await interaction.reply({ content: 'Stopped the music and left the channel.', ephemeral: true });
        break;
        
      case 'queue':
        const queue = player.queue;
        
        if (!queue.length) {
          return interaction.reply({ 
            content: 'No songs in the queue.',
            ephemeral: true 
          });
        }
        
        const queueList = queue.map((track, index) => 
          `${index + 1}. [${track.title}](${track.uri}) [${formatDuration(track.duration)}]`
        ).join('\n');
        
        const embed = createEmbed(
          'Current Queue', 
          `**Now Playing:** [${player.queue.current.title}](${player.queue.current.uri})\n\n**Up Next:**\n${queueList}`,
          '#0099FF'
        );
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
        break;
    }
  } else if (interaction.isChatInputCommand()) {
    // Handle slash commands
    const command = client.slashCommands.get(interaction.commandName);
    
    if (!command) return;
    
    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      await interaction.reply({ 
        content: 'There was an error executing this command!', 
        ephemeral: true 
      });
    }
  }
});

// Helper functions
function formatDuration(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const hours = Math.floor(ms / 1000 / 60 / 60);

  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Login to Discord
client.login(config.token);