const HistoricalDataClass = require('./classes/historicalData');
require('dotenv').config();
const config = require('../config.json');

// Relevant data fields, used to enumerate
const dataFields = ['score', 'kills', 'deaths', 'assists', 'suicides', 'tk', 'shots', 'hits', 'headshots', 'rounds_tr', 'rounds_ct', 'knife', 'glock', 'hkp2000', `usp_silencer`, `p250`, `deagle`, `elite`, `fiveseven`, `tec9`, `cz75a`, `revolver`, `nova`, `xm1014`, `mag7`, `sawedoff`, `bizon`, `mac10`, `mp9`, `mp7`, `ump45`, `p90`, `galilar`, `ak47`, `scar20`, `famas`, `m4a1`, `m4a1_silencer`, `aug`, `ssg08`, `sg556`, `awp`, `g3sg1`, `m249`, `negev`, `hegrenade`, `flashbang`, `smokegrenade`, `inferno`, `decoy`, `taser`, `mp5sd`, `head`, `chest`, `stomach`, `left_arm`, `right_arm`, `left_leg`, `right_leg`, `c4_planted`, `c4_exploded`, `c4_defused`, `ct_win`, `tr_win`, `hostages_rescued`, `vip_killed`, `vip_escaped`, `vip_played`, `mvp`, `damage`, `match_win`, `match_draw`, `match_lose`]

/*
______  ___ _____ ___ ______  ___  _____ _____ 
|  _  \/ _ \_   _/ _ \| ___ \/ _ \/  ___|  ___|
| | | / /_\ \| |/ /_\ \ |_/ / /_\ \ `--.| |__  
| | | |  _  || ||  _  | ___ \  _  |`--. \  __| 
| |/ /| | | || || | | | |_/ / | | /\__/ / |___ 
|___/ \_| |_/\_/\_| |_|____/\_| |_|____/\____/ 
*/


const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.MYSQL_DB, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, {
    host: process.env.MYSQL_HOST,
    dialect: 'mysql',

    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    logging: config.logSQL,
});

// Test to make sure we can connect to the database. If not, it will exit the process.
sequelize
    .authenticate()
    .then(() => {
        console.log('Database connection has been established successfully.');
    });


// Initiate the player model
const Player = require("./models/player")(sequelize, Sequelize);
// Initialize the historicalData model
const HistoricalData = require('./models/historicalData')(sequelize, Sequelize);

Player.sync().then(() => {
    console.log('Synced Player model');
})

// Bind models to object
const Models = {
    Player,
    HistoricalData
}

global.models = Models;

/*
______ _____ _____ _____ _________________ 
|  _  \_   _/  ___/  __ \  _  | ___ \  _  \
| | | | | | \ `--.| /  \/ | | | |_/ / | | |
| | | | | |  `--. \ |   | | | |    /| | | |
| |/ / _| |_/\__/ / \__/\ \_/ / |\ \| |/ / 
|___/  \___/\____/ \____/\___/\_| \_|___/  
*/

if (config.discordBot.enabled) {
    const Commando = require('discord.js-commando');
    const path = require('path');
    const sqlite = require('sqlite');

    const client = new Commando.Client({
        commandPrefix: config.discordBot.prefix,
        owner: config.discordBot.owner
    });

    client.on('ready', () => {
        console.log(`Connected to Discord as ${client.user.tag}!`);
    });

    client.on('commandRun', (command, promise, message) => {
        console.log(`Command ${command.name} run by ${message.author.tag}`)
    });

    client.on('error', e => {
        console.log(e)
    });

    // Guild settings persistance
    client.setProvider(
        sqlite.open(path.join(__dirname, 'settings.sqlite3')).then(db => new Commando.SQLiteProvider(db))
    ).catch(e => console.log(e));

    client.dataFields = dataFields;

    client.registry
        .registerGroups([
            ['stats', 'Statistics about CSGO'],
        ])
        .registerDefaults()
        .registerCommandsIn(path.join(__dirname, 'commands'));

    client.login(process.env.DISCORD_TOKEN);

    // Connect the player model to the discord client
    client.Player = Player;
    client.sequelize = sequelize;
    client.config = config;
    global.client = client;
}

/*
__          __  _                                  
\ \        / / | |                                 
 \ \  /\  / /__| |__  ___  ___ _ ____   _____ _ __ 
  \ \/  \/ / _ \ '_ \/ __|/ _ \ '__\ \ / / _ \ '__|
   \  /\  /  __/ |_) \__ \  __/ |   \ V /  __/ |   
    \/  \/ \___|_.__/|___/\___|_|    \_/ \___|_|   
*/

if (config.webserver.enabled) {
    const Web = require('./classes/web');
    const app = new Web();

    global.app = app;
}

/*
  _    _ _     _             _           _   _____        _
 | |  | (_)   | |           (_)         | | |  __ \      | |
 | |__| |_ ___| |_ ___  _ __ _  ___ __ _| | | |  | | __ _| |_ __ _
 |  __  | / __| __/ _ \| '__| |/ __/ _` | | | |  | |/ _` | __/ _` |
 | |  | | \__ \ || (_) | |  | | (_| (_| | | | |__| | (_| | || (_| |
 |_|  |_|_|___/\__\___/|_|  |_|\___\__,_|_| |_____/ \__,_|\__\__,_|
*/

if (config.historicalData.enabled) {
    // Start the historicalData class
    HistoricalData.sync().then(() => {
        console.log('Synced HistoricalData model');
        const historicalDataHook = new HistoricalDataClass();
    })
}

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    process.exit(1);
});