const Discord = require('discord.js');
const keep_alive = require('./keep_alive.js');
const { login } = require("./util/login.js");
const { readdirSync } = require("fs");
const db = require('quick.db');
const ms = require("ms");
const { MessageEmbed } = require('discord.js');

const client = new Discord.Client({
  fetchAllMembers: true,
  partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'GUILD_PRESENCES', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES'],
  intents: [
    Discord.Intents.FLAGS.DIRECT_MESSAGES,
    Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.DIRECT_MESSAGE_TYPING,
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_BANS,
    Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
    Discord.Intents.FLAGS.GUILD_INVITES,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING,
    Discord.Intents.FLAGS.GUILD_PRESENCES,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES,
    Discord.Intents.FLAGS.GUILD_WEBHOOKS,
  ]
});

// Connect to Discord with login
login(client);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  if (err.message) return;
  console.error("Uncaught Promise Error:", err);
});

// Load commands from the ./commands/ directory
const loadCommands = (dir = "./commands/") => {
  try {
    readdirSync(dir).forEach(dirs => {
      const commands = readdirSync(`${dir}/${dirs}/`).filter(files => files.endsWith(".js"));

      commands.forEach(file => {
        try {
          const getFileName = require(`${dir}/${dirs}/${file}`);
          client.commands.set(getFileName.name, getFileName);
          console.log(`> Commande Charger ${getFileName.name} [${dirs}]`);
        } catch (err) {
          console.error(`Erreur lors du chargement de la commande ${file}: `, err);
        }
      });
    });
  } catch (err) {
    console.error("Erreur lors du chargement des commandes:", err);
  }
};

// Load events from the ./events/ directory
const loadEvents = (dir = "./events/") => {
  try {
    readdirSync(dir).forEach(dirs => {
      const events = readdirSync(`${dir}/${dirs}/`).filter(files => files.endsWith(".js"));

      events.forEach(event => {
        try {
          const evt = require(`${dir}/${dirs}/${event}`);
          const evtName = event.split(".")[0];
          client.on(evtName, evt.bind(null, client));
          console.log(`> Event Charger ${evtName}`);
        } catch (err) {
          console.error(`Erreur lors du chargement de l'événement ${event}: `, err);
        }
      });
    });
  } catch (err) {
    console.error("Erreur lors du chargement des événements:", err);
  }
};

// Load events and commands
loadEvents();
loadCommands();

// Additional safety: Ensure client is ready before proceeding
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  // Any initialization code here...
});
