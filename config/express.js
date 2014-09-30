
/**************************************************************************************
 *	Module Dependencies
 **************************************************************************************/

var morgan = require('morgan');
var express = require('express');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var compression = require('compression');
var serveStatic = require('serve-static');
var methodOverride = require('method-override');

/**************************************************************************************
 *	Express Configuration
 **************************************************************************************/

module.exports = function (app, config) {

	app.set('port', config.port);

	/**************************************************************************************
	 *	Middleware Stack
	 **************************************************************************************/
	app.disable('x-powered-by');

	app.use(morgan('dev'));
	app.use(methodOverride());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());
	app.use(compression({threshold: 512}));

};