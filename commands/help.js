//example help command

module.exports = ({commands, message}) => {
  var resultMsg = "";
  Object.keys(commands).forEach((cmd) => {
          if(commands[cmd].meta.event === "message") {
                  resultMsg = resultMsg + `\n${cmd} - ${commands[cmd].meta.description}`;
          }
  });

  message.channel.send(resultMsg);
}
