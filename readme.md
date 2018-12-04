# purplewaffle

purplewaffle is a discord.js command system, aiming for flexibility and simplicity

i don't recommend using purplewaffle in it's current state, as it's heavily WIP

## how to use

you dont need to change anything other than files in the script directory and the config.json file. (the config.json file is required to run the bot, and there's an example in config.example.json)

after youve changed everything to your needs, simply run it with node (node main.js (--v))

you can include the --v (or --verbose) parameter to see all verbose logs. if you ever get an error, re-run the bot in verbose mode and when you get the error, attach the log to the issue

### config.json values

```json
{
    "token": "", //the token for the bot
    "commandsFolder": "./commands", //the folder in which all the commands/scripts are stored in
    "ownerid": "", //your id, will be used for the OWNER permission
    "prefix": "" //the prefix for the bot, ex. "pw-"
}
```

## how to add commands

adding commands is very simple: add a .js file in your script directory, and an optional but recommended file with the same name, but with .meta.json instead of .js.

each command/script is a simple script (not to be confused with a module) that's ran in the event, specified in the meta json (message by default). for example, if you have the event be "message", then the script is ran when theres a command with the format prefix commandname arguments.

### public script variables

- **message** - the message value. (only in message event)
- **args** - arguments of the message (message.content.split(" ")) (only in message event)
- **bot** - the d.js client value

you can use any other value defined in main.js, too (example in help.js)

### script metadata values

```json
{
    "permissions": {
        "whitelist": false, //whether you want the command to be only executable by permissions in the list below
        "list": [] //the list of permissions able to execute the command (d.js permissions and OWNER for owner-only)
    },
    "event": "message", //what event to add the script to
    "description": "evaluate a piece of code" //the description (used in help.js)
}
```

purplew*α*ffle
