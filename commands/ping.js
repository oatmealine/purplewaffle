//ping

module.exports = async ({message}) => {
  const pingStartDate = Date.now()

  let m2 = await message.channel.send('testing ping...');
  m2.edit(`ping: ${Date.now() - pingStartDate}ms`);
};
