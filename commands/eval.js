module.exports = ({message, Config, cmdName}) => {
    try {
        const code = message.content.replace(Config.prefix + cmdName, '');
        let evaled = eval(code);

        if (typeof evaled !== 'string')
            evaled = require('util').inspect(evaled);

        const embed = {
            title: 'Eval',
            color: '990000',
            fields: [{
                name: 'Input',
                value: '```xl\n' + code + '\n```',
                inline: false
            },
            {
                name: 'Output',
                value: '```xl\n' + evaled + '\n```',
                inline: false
            }
            ]
        };

        message.channel.send('', { embed });
        message.react('☑');
    } catch (err) {
        message.channel.send(`:warning: \`ERROR\` \`\`\`xl\n${err.stack}\n\`\`\``);
    }
};
