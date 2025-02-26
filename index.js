const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin } = require('@distube/yt-dlp');
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
  }
};

// Initialize DisTube with plugins
client.distube = new DisTube(client, {
  leaveOnStop: false,
  leaveOnFinish: false,
  leaveOnEmpty: true,
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: false,
  emitAddListWhenCreatingQueue: false,
  plugins: [
    new SpotifyPlugin({
      emitEventsAfterFetching: true,
      api: {
        clientId: config.spotify.clientId,
        clientSecret: config.spotify.clientSecret,
      },
    }),
    new SoundCloudPlugin(),
    new YtDlpPlugin()
  ]
});

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

// Utility function for creating embeds
function createEmbed(title, description, color = '#FF0000') {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
}

// Utility function to create music control buttons
function createMusicControlButtons() {
  return new ActionRowBuilder()
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
}

// DisTube event listeners
client.distube
  .on('playSong', (queue, song) => {
    const embed = createEmbed(
      'Now Playing', 
      `[${song.name}](${song.url}) - \`${formatDuration(song.duration * 1000)}\`\nRequested by: ${song.user}`,
      '#00FF00'
    );
    
    queue.textChannel.send({ 
      embeds: [embed], 
      components: [createMusicControlButtons()]
    }).then(msg => {
      queue.nowPlayingMessage = msg.id;
    });
  })
  
  .on('addSong', (queue, song) => {
    queue.textChannel.send({
      embeds: [createEmbed(
        'Added to Queue', 
        `[${song.name}](${song.url}) - \`${formatDuration(song.duration * 1000)}\`\nRequested by: ${song.user}`,
        '#0099FF'
      )]
    });
  })
  
  .on('addList', (queue, playlist) => {
    queue.textChannel.send({
      embeds: [createEmbed(
        'Added Playlist to Queue', 
        `Added [${playlist.name}](${playlist.url}) (${playlist.songs.length} songs) to the queue\nRequested by: ${playlist.user}`,
        '#0099FF'
      )]
    });
  })
  
  .on('empty', queue => {
    queue.textChannel.send({
      embeds: [createEmbed('Channel Empty', 'Leaving the voice channel because everyone left.', '#FFFF00')]
    });
  })
  
  .on('error', (channel, error) => {
    if (channel) {
      channel.send({
        embeds: [createEmbed('Error!', `An error occurred: ${error.toString().slice(0, 1974)}`, '#FF0000')]
      });
    } else {
      console.error(error);
    }
  })
  
  .on('finish', queue => {
    queue.textChannel.send({
      embeds: [createEmbed('Queue Finished', 'No more songs in the queue.', '#FFFF00')]
    });
  })
  
  .on('disconnect', queue => {
    queue.textChannel.send({
      embeds: [createEmbed('Disconnected', 'Disconnected from the voice channel.', '#FFFF00')]
    });
  });

// Discord.js event handlers
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

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
    const queue = client.distube.getQueue(interaction.guildId);
    
    if (!queue) {
      return interaction.reply({ 
        content: 'No music is currently playing.', 
        ephemeral: true 
      });
    }
    
    switch (customId) {
      case 'pause_resume':
        if (queue.paused) {
          queue.resume();
          await interaction.reply({ content: 'Resumed the music.', ephemeral: true });
        } else {
          queue.pause();
          await interaction.reply({ content: 'Paused the music.', ephemeral: true });
        }
        break;
        
      case 'skip':
        try {
          await queue.skip();
          await interaction.reply({ content: 'Skipped the song.', ephemeral: true });
        } catch (e) {
          await interaction.reply({ content: `Error: ${e}`, ephemeral: true });
        }
        break;
        
      case 'stop':
        queue.stop();
        await interaction.reply({ content: 'Stopped the music.', ephemeral: true });
        break;
        
      case 'queue':
        if (!queue.songs.length) {
          return interaction.reply({ 
            content: 'No songs in the queue.',
            ephemeral: true 
          });
        }
        
        const queueList = queue.songs
          .slice(0, 10) // Limit to first 10 songs for readability
          .map((song, index) => 
            `${index === 0 ? '**Now Playing:**' : `**${index}.**`} [${song.name}](${song.url}) - \`${formatDuration(song.duration * 1000)}\``
          )
          .join('\n');
        
        const totalSongs = queue.songs.length - 1;
        const totalDuration = formatDuration(
          queue.songs.reduce((acc, song) => acc + song.duration * 1000, 0)
        );
        
        const embed = createEmbed(
          'Music Queue', 
          `${queueList}\n\n${totalSongs > 10 ? `\nAnd ${totalSongs - 10} more song(s)` : ''}\n\n**Total Duration:** \`${totalDuration}\``,
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