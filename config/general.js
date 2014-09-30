
/**************************************************************************************
 *	Module Dependencies
 **************************************************************************************/

var root_path = require('path').resolve(__dirname + '../..');


/**************************************************************************************
 *  General Configuration
 **************************************************************************************/

var environment = process.env.NODE_ENV || 'development';
var environment = process.env.NODE_ENV

// Production
var config = {

	env: environment,
	root: root_path,
	port: 80,
	wp_mysql: {
		host: "144.76.120.42",
		port: 3306,
		user: "splitscr_app",
		password: "6S0-5PaM[P",
		database: "splitscr_app",
		wp_prefix: "wp_"
	},
	client_cache: {
		maxAge: 60000*60 // 1 hour
	}
};

// Development (extends production)
if(environment == 'development') {

	config.port = 80;

	config.wp_mysql = {
		host: "144.76.120.42",
		port: 3306,
		user: "splitscr_app",
		password: "6S0-5PaM[P",
		database: "splitscr_app",
		wp_prefix: "wp_"
	};
}

module.exports = config;