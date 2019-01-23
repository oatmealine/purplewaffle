//example help command

module.exports = ({commands, message}) => {
    let resultMsg = '';
    Object.keys(commands).forEach((cmd) => {
        if(commands[cmd].meta.event === 'message' && (commands[cmd].meta.hidden || false) == false) {
            resultMsg = resultMsg + `\n${cmd} - ${commands[cmd].meta.description}`;
        }
    });

    message.channel.send(resultMsg);
};
