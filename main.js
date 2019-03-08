// version
const version = { ver: [0, 4, 0], symbol: 'alpha' };

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
        verSymbol = '';
}

// style up logs

require('better-logging')(console);

console.success = (text) => console.info(chalk`{green ${text}}`);

if (process.argv.includes('-v') || process.argv.includes('--verbose')) console.loglevel = 4;

const chalk = require('chalk');
chalk.level = 1;

console.line(chalk`\n{magenta purplewaffle {bold v${version.ver.join('.')}${verSymbol}}}\n`); 

console.group('Initialization');

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
    'clientPermissions': {
        'whitelist': false,
        'list': []
    },
    'event': 'message',
    'description': 'No description provided'
};

const requiredConfVariables = ['token', 'commandsFolder', 'prefix', 'blacklist'];
const requiredCmdMetaVars = ['permissions', 'clientPermissions', 'event', 'description'];
const dialogKeys = [
    'msg_userNoPerms',
    'msg_botNoPerms',
    'msg_ownerOnly',
    'msg_permError',
    'msg_runtimeError',
    'msg_loadError'
];

const events = {};

console.group('file loading');
// load config
console.info('loading in config');
let Config = require('./config.json');
const defaultConfig = require('./config.example.json');

// localisation!!
console.info('loading in localisation/dialog');
let dialog;
try {
    dialog = require('./dialog.json');
} catch (err) {
    dialog = {};
    console.warn('dialog file not found');
}

// loading in commands
console.info('grabbing all scripts');
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

console.success('done loading in all files!');
console.groupEnd('file loading');

// time to process stuff
console.group('file processing');

// check for all variables in config
console.info('checking for variables in config file');
requiredConfVariables.forEach((argum) => {
    if (!Object.keys(Config).includes(argum)) {
        console.warn(argum + ' variable isn\'t defined in config file, replacing with default config (purplewaffle may fail)');
        Config[argum] = defaultConfig[argum];
    }
});

// checking dialog.json file
console.info('verifying dialog file');
dialogKeys.forEach((key) => {
    if (!Object.keys(dialog).includes(key)) {
        console.warn(key + ' variable isn\'t defined in dialog file, replacing with placeholder');
        dialog[key] = '${'+key+'}';
    }
});

console.info('processing all commands');

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
                        if (!((argum === 'permissions' || argum === 'clientPermissions') && commands[cmd].meta.event !== 'message')) {
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

console.groupEnd('file processing');

// events & loading em in
console.group('events');
console.info('getting list of all required events');
Object.keys(commands).forEach((cmdName) => {
    const cmd = commands[cmdName];
    console.debug(`${cmdName} requires ${cmd.meta.event}`);
    if (events[cmd.meta.event] === undefined) {
        events[cmd.meta.event] = [];
    }
    events[cmd.meta.event].push(cmdName);
});
console.debug(`required events: ${Object.keys(events).join(', ')}`);

// combine all client events into one
function patchEmitter(emitter) {
    const oldEmit = emitter.emit.bind(emitter);
  
    emitter.emit = (...args) => {
        oldEmit('event', ...args);
        oldEmit(...args);
    };
}

function splitArguments(string) {
    const regex = /[^\s"']+|(?:"((?:[^"\\]|\\")*)"|'((?:[^'\\]|\\')*)')+(?: |$)/gi;
    const arr = [];
    let match = null;

    do {
        match = regex.exec(string);
        if (match != null) {
            arr.push((match[1] || match[2]) ? ((match[1] || '') + (match[2] || '')).replace(/\\(?=["'])/g, '') : match[0]);
        }
    } while (match != null);
	
    return arr;
}

// create main event listener
console.info('creating main event listener');
patchEmitter(bot);

bot.on('event', (event, ...eventargs) => {
    const ignoreEvents = ['raw', 'debug']; // events to not log in verbose
    if (!ignoreEvents.includes(event)) console.debug(`event: ${event}`);
    let message;
    switch (event) {
        case 'message':
            message = eventargs[0];
            if (message.content.startsWith(Config.prefix)) {
                if (Config.blacklist.includes(Number(message.author.id))) return;
                if (message.content === Config.prefix + 'reload' && Config.ownerid === message.author.id) { // this command is hardcoded because it uses a lot of internal functions
                    message.channel.send('reloading commands...\nreloading config...\nreloading dialog...').then(reloadmsg => {
                        processCommands();
                        reloadmsg.edit(reloadmsg.content.replace('...','.. done'));
                        setTimeout(() => {
                            Config = require('./config.json');
                            reloadmsg.edit(reloadmsg.content.replace('...','.. done'));
                        }, 1000);
                        setTimeout(() => {
                            try {
                                dialog = require('./dialog.json');
                                reloadmsg.edit(reloadmsg.content.replace('...','.. done'));
                            } catch (err) {
                                reloadmsg.edit(reloadmsg.content.replace('...','.. failed'));
                            }
                        }, 2000);
                    });
                }
                events.message.forEach((cmdName) => {
                    const cmd = commands[cmdName];
                    if (message.content.startsWith(Config.prefix + cmdName)) {
                        const args = splitArguments(message.content); // in `.say 'hi, how' "are you"` it would be ['.say', 'hi, how', 'are you']
                        console.info(`got command ${chalk.bold(cmdName)}, processing`);
                        console.debug(`${chalk.bold(cmdName)}: verifying permissions`);
                        try {
                            if (cmd.meta.permissions.whitelist) {
                                if (cmd.meta.permissions.list.includes('OWNER')) {
                                    if (Config.ownerid !== message.author.id) {
                                        throw new Error(dialog.msg_ownerOnly);
                                    }
                                } else {
                                    if (!message.member.hasPermission(cmd.meta.permissions.list)) {
                                        throw new Error(dialog.msg_userNoPerms.replace('$1', cmd.meta.permissions.list.join(', ')));
                                    }
                                }
                                if (!message.channel.permissionsFor(bot.user.id).has(cmd.meta.clientPermissions.list)) {
                                    throw new Error(dialog.msg_botNoPerms.replace('$1', cmd.meta.clientPermissions.list.join(', ')));
                                }
                            }
                        } catch (err) {
                            console.debug('permission error: '+err);
                            message.channel.send(dialog.msg_permError.replace('$1', err.stack));
                            return;
                        }
    
                        console.debug(`${chalk.bold(cmdName)}: permissions match, executing command`);
                        try {
                            commands[cmdName].module({args, message, commands, bot, Config, cmdName, version, verSymbol, processCommands});
                        } catch (err) {
                            message.channel.send(dialog.msg_runtimeError.replace('$1', cmdName).replace('$2', err.stack));
                            console.error(`${chalk.bold(cmdName)}: runtime error: \n${err.stack}`);
                        }
                        console.info(`${chalk.bold(cmdName)}: processed`);
                    }
                });
            }
            return;
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
    if (Object.keys(events).includes(event) && event !== 'message') {
        console.info(`running tasks for ${event}...`);
        events[event].forEach(cmdName => {
            try {
                commands[cmdName].module({commands, bot, Config, version, verSymbol, eventargs, processCommands});
            } catch (err) {
                console.error(`${chalk.bold(cmdName)}: runtime error:\n${err.stack}`);
            }
        });
        if (event === 'ready') {
            console.success(`bot is ready!\n${chalk.magenta.bold(`Thank you for using Purplewaffle v${version.ver.join('.')}${verSymbol}`)}`);
            console.groupEnd('Initialization');
        }
    }
});
console.success('done creating event stuff');
console.groupEnd('events');

console.info('logging in...');
bot.login(Config.token); // login and hope nothing explodes

// destroy the bot process onexit
function cleanup(code) {
    if (code !== 0) console.error('Please report this error to the Purplewaffle GitHub page!');
    bot.destroy();
    console.log('Goodbye!');
    process.exit();
}

process.on('exit', cleanup);

// catches ctrl+c event
process.on('SIGINT', ()=>{process.exit(0);});

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', ()=>{process.exit(0);});
process.on('SIGUSR2', ()=>{process.exit(0);});

// catches uncaught exceptions
process.on('uncaughtException', (err)=>{
    if (err.fileName === 'main.js') {
        console.error('PurpleWaffle error encountered!');
        console.error(err.stack);
        process.exit(1);
    } else {
        console.error('Non-PurpleWaffle uncaught error encountered!');
        console.error(err.stack);
    }
});