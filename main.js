//version
var version = { ver: [0, 2, 0], symbol: "alpha" };

//this is mainly just for fanciness lol
var verSymbol;
switch (version.symbol) {
    case "alpha":
        verSymbol = "α";
        break;
    case "beta":
        verSymbol = "β";
        break;
    case "release":
        verSymbol = "δ";
        break;
    default:
        verSymbol = " ";
}

console.log(`\n${'\x1b[35m'}purplewaffle ${'\x1b[2m'}v${version.ver.join(".")}${verSymbol}${'\x1b[0m'}\n`); 
//the weird-ass number-letter combinations are escape characters for colors.
//ive highlighted them in ${} as theyre much harder to tell apart from the real text without chalk being loaded in yet
//also, pretty funny how in the vscode terminal, these color escape sequences for colors work, but chalk doesnt
//fix your vscode support chalk

//reality check
if (2 + 2 !== 4) {
    throw new Error("reality check failed!! something must have fucked up badly");
    process.exit(1);
}

//load config
console.log(`loading in config`);
var Config = require("./config.json");

console.log(`loading in all required modules`);
var Discord = require("discord.js"); //discordjs
var util = require("util")
const chalk = require("chalk");
const fs = require("fs"); //filesystem module

var bot = new Discord.Client(); //create bot object

//here come the variables
var commandNamesArray = [];
var cmddirFiles = [];
var commands = {};

var defaultCmdMeta = {
    "permissions": {
        "whitelist": false,
        "list": []
    },
    "event": "message",
    "description": "No description provided"
}

var requiredConfVariables = ["token", "commandsFolder", "prefix"];
var requiredCmdMetaVars = ["permissions", "event", "description"];

var events = {};

//style up logs

var logInfo = (text, newline=false) => {
    if (newline) {console.log("")};
    console.log(chalk.blue.bold('[I] ') + text);
}
var logVerbose = (text, newline=false) => {
    if (newline) {console.log("")};
    if(process.argv.includes("--v") || process.argv.includes("--verbose")) {
        console.log(chalk.cyan.bold('[V] ') + text);
    }
}
var logSuccess = (text, newline=false) => {
    if (newline) {console.log("")};
    console.log(chalk.green.bold('[✔️] ') + text);
}
var logWarning = (text, newline=false) => {
    if (newline) {console.log("")};
    console.log(chalk.yellow.bold('[W] ') + text);
}
var logError = (text, newline=false) => {
    if (newline) {console.log("")};
    console.log(chalk.red.bold('[E] ') + text);
}


//check for all variables in config
logInfo(`checking for variables in config file`, true);
requiredConfVariables.forEach((argum) => {
    if (!Object.keys(Config).includes(argum)) {
        logWarning(argum + " variable isn't defined in config file, purplewaffle may fail");
    }
});
logSuccess(`done`)
//loading in commands
logInfo(`grabbing all scripts`, true);
logVerbose(`scripts folder: ${Config.commandsFolder}`);

fs.readdirSync(Config.commandsFolder).forEach((file) => {
    if (file.endsWith(".js")) {
        commandNamesArray.push(file.replace(".js", ""));
        logVerbose(`${chalk.magenta('[code]')} ${file}`);
    } else if (file.endsWith(".meta.json")) {
        logVerbose(`${chalk.magenta('[meta]')} ${file}`);
    };
    cmddirFiles.push(file);
});

logSuccess(`done`);

//time to process commands
logInfo(`processing all commands`, true);

function processCommands() {
    for (indx in commandNamesArray) {
        var cmd = commandNamesArray[indx];
        logVerbose(`processing: ${cmd}`);
        commands[cmd] = {};
        commands[cmd].module = require(Config.commandsFolder + "/" + cmd + ".js");

        if (!cmddirFiles.includes(cmd + ".meta.json")) {
            logWarning(cmd + " does not have a meta file, using default one");
            commands[cmd].meta = defaultCmdMeta;
        } else {
            try {
                commands[cmd].meta = require(Config.commandsFolder + "/" + cmd + ".meta.json");
                requiredCmdMetaVars.forEach((argum) => {
                    if (!Object.keys(commands[cmd].meta).includes(argum)) {
                        if(!(argum === "permissions" && commands[cmd].meta.event !== "message")) {
                            logWarning(argum + " variable isn't defined in metadata file, replacing with default value");
                            commands[cmd].meta[argum] = defaultCmdMeta[argum];
                        }
                    }
                });
            } catch (err) {
                logWarning(cmd + "'s meta file gave an error, replacing it with default metadata - " + err);
                commands[cmd].meta = defaultCmdMeta;
            }
        }

        logVerbose(`done`);
    }
}
processCommands()
logSuccess(`all commands are done processing`);

//events & loading em in
logInfo(`getting list of all required events`, true);
Object.keys(commands).forEach((cmdName) => {
    var cmd = commands[cmdName];
    logVerbose(`${cmdName} requires ${cmd.meta.event}`)
    if (events[cmd.meta.event] === undefined) {
        events[cmd.meta.event] = [];
    }
    events[cmd.meta.event].push(cmdName);
});
logSuccess(`required events: ${Object.keys(events).join(", ")}`);

//combine all client events into one
function patchEmitter(emitter) {
    const oldEmit = emitter.emit.bind(emitter)
  
    emitter.emit = (...args) => {
      oldEmit('event', ...args)
      oldEmit(...args)
    }
  }

//create main event listener
logInfo(`creating main event listener`, true);
patchEmitter(bot)

bot.on('event', (event, ...eventargs) => {
    var ignoreEvents = ['raw', 'debug'] //events to not log in verbose
    if(!ignoreEvents.includes(event)) logVerbose(`event: ${event}`)
    let runScript = true
    switch(event) {
        case 'message':
            runScript = false //message event has a custom script handler, so we disable running the script after it
            var message = eventargs[0]
            if(message.content.startsWith(Config.prefix)) {
                events.message.forEach((cmdName) => {
                    var cmd = commands[cmdName];
                    if (message.content.startsWith(Config.prefix + cmdName)) {
                        var args = message.content.split(" "); //in '.say hi, how are you' it would be ['.say', 'hi,', 'how', 'are', 'you']
                        let allowRun = true;
                        logInfo(`got command ${chalk.bold(cmdName)}, processing`, true);
                        logVerbose(`${chalk.bold(cmdName)}: verifying permissions`);
                        try {
                            if (cmd.meta.permissions.whitelist) {
                                if (cmd.meta.permissions.list.includes("OWNER")) {
                                    if (Config.ownerid === message.author.id) {
                                        allowRun = true;
                                    } else {
                                        throw new Error("Command is bot owner-only");
                                    }
                                } else {
                                    if (message.member.hasPermissions(cmd.meta.permissions.list)) {
                                        allowRun = true;
                                    } else {
                                        throw new Error("Invalid permissions (required: " + cmd.meta.permissions.list.join(", ") + ")");
                                    }
                                }
                            }
                        } catch (err) {
                            message.channel.send(`Permission error: \`${err}\` `);
                            allowRun = false;
                        }
    
                        if(allowRun) {
                            logVerbose(`${chalk.bold(cmdName)}: permissions match, executing command`);
                            try {
                                commands[cmdName].module({args, message, commands, logInfo, logVerbose, bot, Config, cmdName, version, verSymbol});
                            } catch (err) {
                                message.channel.send(`Runtime error in command ${cmdName}: \`${err}\``);
                                logError(`${chalk.bold(cmdName)}: runtime error: ${chalk.red(err)}`);
                            }
                        } else {
                            logVerbose(`${chalk.bold(cmdName)}: permissions don't match, aborting command`);
                        }
                        logInfo(`${chalk.bold(cmdName)}: processed`);
                    }
                });
            }
        break;
        case 'ready':
            logSuccess(`logged in!`);
            if (Config.ownerid == undefined || Config.ownerid == "") {
                logInfo('ownerid not defined on config.json, getting from application owner')
                bot.fetchApplication().then(app => {
                    Config.ownerid = app.owner.id;
                })
            }
        break;
    }
    if(runScript) {
        if(Object.keys(events).includes(event)) {
            logInfo(`running tasks for ${event}`)
            events[event].forEach(cmdName => {
                try {
                    commands[cmdName].module({commands, logInfo, logVerbose, bot, Config, version, verSymbol});
                } catch (err) {
                    logError(`${chalk.bold(cmdName)}: runtime error: ${chalk.red(err)}`);
                }
            })
            if(event === 'ready') {
                logSuccess(`bot is ready!\n${chalk.white.bold(`Thank you for using Purplewaffle v${version.ver.join(".")}${verSymbol}`)}`);
            }
        }
    }
})
logSuccess(`done`)

logInfo(`logging in...`, true);
bot.login(Config.token); //login and hope nothing explodes
