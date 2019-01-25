// version
const version = { ver: [0, 3, 0], symbol: 'alpha' };

// this is mainly just for fanciness lol
let verSymbol;
switch (version.symbol) {
    case 'alpha':
        verSymbol = 'α';
        break;
    case 'beta':
        verSymbol = 'β';
        break;
    case 'release':
        verSymbol = 'δ';
        break;
    default:
        verSymbol = ' ';
}

// style up logs

require('better-logging')(console);

console.success = (text) => console.info(chalk`{green ${text}}`);

if (process.argv.includes('-v') || process.argv.includes('--verbose')) console.loglevel = 4;

const chalk = require('chalk');
chalk.level = 1;

console.line(chalk`\n{magenta purplewaffle {bold v${version.ver.join('.')}${verSymbol}}}\n`); 

console.group('Initialization');
// load config
console.info('loading in config');
const Config = require('./config.json');

// localisation!!
console.info('loading in localisation/dialog');
let dialog;
try {
    dialog = require('./dialog.json');
} catch (err) {
    dialog = {};
    console.warn('dialog file not found');
}

console.info('loading in all required modules');
const Discord = require('discord.js'); // discordjs
const fs = require('fs'); // filesystem module

const bot = new Discord.Client(); // create bot object

// here come the variables
const commandNamesArray = [];
const cmddirFiles = [];
const commands = {};

const defaultCmdMeta = {
    'permissions': {
        'whitelist': false,
        'list': []
    },
    'event': 'message',
    'description': 'No description provided'
};

const requiredConfVariables = ['token', 'commandsFolder', 'prefix'];
const requiredCmdMetaVars = ['permissions', 'event', 'description'];
const dialogKeys = [
    'msg_userNoPerms',
    'msg_botNoPerms',
    'msg_ownerOnly',
    'msg_permError',
    'msg_runtimeError',
    'msg_loadError'
];

const events = {};

// check for all variables in config
console.info('checking for variables in config file', true);
requiredConfVariables.forEach((argum) => {
    if (!Object.keys(Config).includes(argum)) {
        console.warn(argum + ' variable isn\'t defined in config file, purplewaffle may fail');
    }
});
console.success('done');

// checking dialog.json file
console.info('verifying dialog file', true);
dialogKeys.forEach((key) => {
    if (!Object.keys(dialog).includes(key)) {
        console.warn(key + ' variable isn\'t defined in dialog file, replacing with placeholder');
        dialog[key] = '${'+key+'}';
    }
});

// loading in commands
console.info('grabbing all scripts', true);
console.debug(`scripts folder: ${Config.commandsFolder}`);

fs.readdirSync(Config.commandsFolder).forEach((file) => {
    if (file.endsWith('.js')) {
        commandNamesArray.push(file.replace('.js', ''));
        console.debug(`${chalk.magenta('[code]')} ${file}`);
    } else if (file.endsWith('.meta.json')) {
        console.debug(`${chalk.magenta('[meta]')} ${file}`);
    }
    cmddirFiles.push(file);
});

console.success('done');

// time to process commands
console.info('processing all commands', true);

function processCommands() {
    for (const indx in commandNamesArray) {
        const cmd = commandNamesArray[indx];
        console.debug(`processing: ${cmd}`);
        commands[cmd] = {};
        commands[cmd].module = require(Config.commandsFolder + '/' + cmd + '.js');

        if (!cmddirFiles.includes(cmd + '.meta.json')) {
            console.warn(cmd + ' does not have a meta file, using default one');
            commands[cmd].meta = defaultCmdMeta;
        } else {
            try {
                commands[cmd].meta = require(Config.commandsFolder + '/' + cmd + '.meta.json');
                requiredCmdMetaVars.forEach((argum) => {
                    if (!Object.keys(commands[cmd].meta).includes(argum)) {
                        if (!(argum === 'permissions' && commands[cmd].meta.event !== 'message')) {
                            console.warn(argum + ' variable isn\'t defined in metadata file, replacing with default value');
                            commands[cmd].meta[argum] = defaultCmdMeta[argum];
                        }
                    }
                });
            } catch (err) {
                console.warn(cmd + '\'s meta file gave an error, replacing it with default metadata - ' + err);
                commands[cmd].meta = defaultCmdMeta;
            }
        }

        console.debug('done');
    }
}
processCommands();
console.success('all commands are done processing');

// events & loading em in
console.info('getting list of all required events', true);
Object.keys(commands).forEach((cmdName) => {
    const cmd = commands[cmdName];
    console.debug(`${cmdName} requires ${cmd.meta.event}`);
    if (events[cmd.meta.event] === undefined) {
        events[cmd.meta.event] = [];
    }
    events[cmd.meta.event].push(cmdName);
});
console.success(`required events: ${Object.keys(events).join(', ')}`);

// combine all client events into one
function patchEmitter(emitter) {
    const oldEmit = emitter.emit.bind(emitter);
  
    emitter.emit = (...args) => {
        oldEmit('event', ...args);
        oldEmit(...args);
    };
}

// create main event listener
console.info('creating main event listener', true);
patchEmitter(bot);

bot.on('event', (event, ...eventargs) => {
    const ignoreEvents = ['raw', 'debug']; // events to not log in verbose
    if (!ignoreEvents.includes(event)) console.debug(`event: ${event}`);
    let runScript = true;
    let message;
    switch (event) {
        case 'message':
            runScript = false; // message event has a custom script handler, so we disable running the script after it
            message = eventargs[0];
            if (message.content.startsWith(Config.prefix)) {
                events.message.forEach((cmdName) => {
                    const cmd = commands[cmdName];
                    if (message.content.startsWith(Config.prefix + cmdName)) {
                        const args = message.content.split(' '); // in '.say hi, how are you' it would be ['.say', 'hi,', 'how', 'are', 'you']
                        let allowRun = true;
                        console.info(`got command ${chalk.bold(cmdName)}, processing`, true);
                        console.debug(`${chalk.bold(cmdName)}: verifying permissions`);
                        try {
                            if (cmd.meta.permissions.whitelist) {
                                if (cmd.meta.permissions.list.includes('OWNER')) {
                                    if (Config.ownerid === message.author.id) {
                                        allowRun = true;
                                    } else {
                                        throw new Error(dialog.msg_ownerOnly);
                                    }
                                } else {
                                    if (message.member.hasPermission(cmd.meta.permissions.list)) {
                                        allowRun = true;
                                    } else {
                                        throw new Error(dialog.msg_userNoPerms.replace('$1', cmd.meta.permissions.list.join(', ')));
                                    }
                                }
                                if (message.channel.permissionsFor(bot.user.id).has(cmd.meta.clientPermissions.list)) {
                                    allowRun = true;
                                } else {
                                    throw new Error(dialog.msg_botNoPerms.replace('$1', cmd.meta.clientPermissions.list.join(', ')));
                                }
                            }
                        } catch (err) {
                            console.debug('permission error: '+err);
                            message.channel.send(dialog.msg_permError.replace('$1', err.stack));
                            allowRun = false;
                        }
    
                        if (allowRun) {
                            console.debug(`${chalk.bold(cmdName)}: permissions match, executing command`);
                            try {
                                commands[cmdName].module({args, message, commands, bot, Config, cmdName, version, verSymbol});
                            } catch (err) {
                                message.channel.send(dialog.msg_runtimeError.replace('$1', cmdName).replace('$2', err.stack));
                                console.error(`${chalk.bold(cmdName)}: runtime error: ${chalk.red(err.stack)}`);
                            }
                        } else {
                            console.debug(`${chalk.bold(cmdName)}: permissions don't match, aborting command`);
                        }
                        console.info(`${chalk.bold(cmdName)}: processed`);
                    }
                });
            }
            break;
        case 'ready':
            console.success('logged in!');
            if (Config.ownerid == undefined || Config.ownerid == '') {
                console.info('ownerid not defined on config.json, getting from application owner');
                bot.fetchApplication().then(app => {
                    Config.ownerid = app.owner.id;
                });
            }
            break;
    }
    if (runScript) {
        if (Object.keys(events).includes(event)) {
            console.info(`running tasks for ${event}`);
            events[event].forEach(cmdName => {
                try {
                    commands[cmdName].module({commands, bot, Config, version, verSymbol, eventargs});
                } catch (err) {
                    console.error(`${chalk.bold(cmdName)}: runtime error: ${chalk.red(err.stack)}`);
                }
            });
            if (event === 'ready') {
                console.success(`bot is ready!\n${chalk.white.bold(`Thank you for using Purplewaffle v${version.ver.join('.')}${verSymbol}`)}`);
                console.groupEnd('Initialization');
            }
        }
    }
});
console.success('done');

console.info('logging in...', true);
bot.login(Config.token); // login and hope nothing explodes