const https = require('https');
const fs = require('fs');

const options = {
	key : fs.readFileSync('rootSSL.key'),
	cert : fs.readFileSync('rootSSL.pem')
};

https.createServer(options, function(req, res) {
	res.writeHead(200);
	res.end("hello world\n");
}).listen(8000);