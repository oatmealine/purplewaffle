//ping

var pingStartDate = Date.now()

message.channel.send('testing ping...').then(m2=>{
	m2.edit(`ping: ${Date.now() - pingStartDate}ms`)
})