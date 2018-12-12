//startupPresence

var presenceChange = 0;
var presences = [`Using PurpleWaffle v${version.ver.join(".")}${verSymbol}`, `${Config.prefix}help`, `https://github.com/thefoxbot/purplewaffle`];

function changePresence() {
    bot.user.setPresence({
        game: {
            name: presences[presenceChange%presences.length]
        }
    });
    presenceChange++;
}

setInterval(changePresence, 10000);
changePresence()