
/**************************************************************************************
 *	Splitscreen Nodejs Express Server
 *	------------------------------
 *	Copyright 2014: Nona Creative
 **************************************************************************************/

var express = require('express');
var app = express();

// load general config
var config = require('./config/general');

// load express config
require('./config/express')(app, config);

// load routes
require('./routes/api_v1')(app, config);
require('./routes/git')(app, config);
require('./routes/mailer')(app, config);

// load strings from string store
var strings = require('./config/strings')(app, config);

// print welcome message with server info
console.log(strings.welcome);

// finally init server
require('http').createServer(app)
	.listen(app.get('port'), function() {
		console.log('Server listening on port ' + app.get('port'));
	});