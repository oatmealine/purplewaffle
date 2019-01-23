//ping

module.exports = async ({message}) => {
    const pingStartDate = Date.now();

    const m2 = await message.channel.send('testing ping...');
    m2.edit(`ping: ${Date.now() - pingStartDate}ms`);
};
