//example help command

var resultMsg = "";

Object.keys(commands).forEach((cmd) => {
    resultMsg = resultMsg + `\n${cmd} - ${commands[cmd].description}`;
});

message.channel.send(resultMsg);