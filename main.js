//version
var version = { ver: [0, 0, 0], symbol: "alpha" };

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

console.log(`\n${'\x1b[35m'}purplewaffle ${'\x1b[37m'}v${version.ver.join(".")}${verSymbol}${'\x1b[0m'}\n`); 
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

console.log(`loading in all required modules\n`);
var Discord = require("discord.js"); //discordjs
const chalk = require("chalk");
const fs = require("fs"); //filesystem module

var bot = new Discord.Client(); //create bot object

//here come the variables
var commandsArray = [];
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

var requiredConfVariables = ["token", "commandsFolder"];
var requiredCmdMetaVars = ["permissions", "event", "description"]

//check for all variables in config
console.log(`${chalk.red.yellow('[D]')} checking for variables in config file\n`);
requiredConfVariables.forEach((argum) => {
    if (!Object.keys(Config).includes(argum)) {
        process.emitWarning(argum + " variable isn't defined in config file, purplewaffle may fail")
    }
});

//loading in commands
console.log(`${chalk.red.yellow('[D]')} grabbing all commands`);
console.log(`${chalk.red.yellow('[D]')} commands folder: ${Config.commandsFolder}\n`);

fs.readdirSync(Config.commandsFolder).forEach((file) => {
    if (file.endsWith(".js")) {
        commandsArray.push(file.replace(".js", ""));
        console.debug(`${chalk.cyan('[V]')} ${chalk.magenta('[code]')} ${file}`);
    } else if (file.endsWith(".meta.json")) {
        console.debug(`${chalk.cyan('[V]')} ${chalk.magenta('[meta]')} ${file}`);
    };
    cmddirFiles.push(file);
});

//time to process commands
console.log(`\n${chalk.red.yellow('[D]')} processing all commands\n`);

for (indx in commandsArray) {
    var cmd = commandsArray[indx];
    console.log(`${chalk.red.yellow('[D]')} processing: ${cmd}`);
    commands[cmd] = {};

    if (!cmddirFiles.includes(cmd + ".meta.json")) {
        process.emitWarning(cmd + " does not have a meta file, using default one");
        commands[cmd].meta = defaultCmdMeta;
    } else {
        try {
            commands[cmd].meta = require(Config.commandsFolder + "/" + cmd + ".meta.json");
            requiredCmdMetaVars.forEach((argum) => {
                if (!Object.keys(commands[cmd].meta).includes(argum)) {
                    process.emitWarning(argum + " variable isn't defined in metadata file, replacing with default value");
                    commands[cmd].meta[argum] = defaultCmdMeta[argum];
                }
            });
        } catch (err) {
            process.emitWarning(cmd + "'s meta file gave an error, replacing it with default metadata - " + err);
            commands[cmd].meta = defaultCmdMeta;
        }
    }

    console.log(`${chalk.red.yellow('[D]')} done`);
}

console.log(`\n${chalk.red.yellow('[D]')} all commands are done processing`)


//bot.login(Config.token); //login and hope nothing explodes