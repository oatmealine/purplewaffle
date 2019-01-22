function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = async ({commands, message}) => {
  let rng = Math.floor(Math.random() * 20);

  if (rng == 0) {
    await message.channel.send('https://ddlc.moe');
  } else if (rng <= 8) {
    let tmp = await message.channel.send('Just Monika. Just Monika. Just Monika. Just Monika. Justttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt');
    await sleep(3000);
    tmp.edit('Just Monika.');
  } else if (rng <= 12) {
    await message.channel.send(`[${rng <= 10 ? 'SarCATstic' : '0x0ade'} is upset.]`);
  } else {
    let tmp = await message.channel.send('You can\'t make me.');
    await sleep(10000);
    tmp.edit('🅸 🅲🅷🅰🅽🅶🅴🅳 🅼🆈 🅼🅸🅽🅳. 🅹🆄🆂🆃 🅼🅾🅽🅸🅺🅰');
  }
}
