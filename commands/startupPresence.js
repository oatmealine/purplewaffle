// startupPresence

module.exports = ({version, bot, Config, verSymbol}) => {
    let presenceChange = 0;
    const presences = [
        {game: {name: `PurpleWaffle v${version.ver.join('.')}${verSymbol}`}},
        {game: {name: `${Config.prefix}help`, type: 'LISTENING'}},
        {game: {name: 'https://github.com/thefoxbot/purplewaffle', type: 'WATCHING'}}
    ];

    function changePresence() {
        bot.user.setPresence(presences[presenceChange%presences.length]);
        presenceChange++;
    }

    setInterval(changePresence, 5000);
    changePresence();
};
