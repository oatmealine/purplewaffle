//example help command

var resultMsg = "";
Object.keys(commands).forEach((cmd) => {
    resultMsg = resultMsg + `\n${cmd} - ${commands[cmd].meta.description}`;
});

message.channel.send(resultMsg);