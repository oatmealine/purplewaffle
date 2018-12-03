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

console.clear()
console.log(`purplewaffle v${version.ver.join(".")}${verSymbol}\n`);

//reality check
if (2 + 2 !== 4) {
    throw new Error("reality check failed!! something must have fucked up badly");
    process.exit(1);
}

//load config
console.log("[D] loading in config...");
var Config = require("./config.json");

console.log("[D] loading in all required modules\n");
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
console.log("[D] checking for variables in config file\n");
requiredConfVariables.forEach((argum) => {
    if (!Object.keys(Config).includes(argum)) {
        process.emitWarning(argum + " variable isn't defined in config file, purplewaffle may fail")
    }
});

//loading in commands
console.log("[D] grabbing all commands");
console.log("[D] commands folder: " + Config.commandsFolder + "\n");

fs.readdirSync(Config.commandsFolder).forEach((file) => {
    if (file.endsWith(".js")) {
        commandsArray.push(file.replace(".js", ""));
        console.debug("[V] [code] " + file);
    } else if (file.endsWith(".meta.json")) {
        console.debug("[V] [meta] " + file);
    };
    cmddirFiles.push(file);
});

//time to load all in
console.log("\n[D] loading all commands");

for (indx in commandsArray) {
    var cmd = commandsArray[indx];
    console.log("\n[D] loading in: " + cmd);
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

    console.log("[D] done");
}



//bot.login(Config.token); //login and hope nothing explodes