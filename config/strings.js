
/**************************************************************************************
 *  Keeping It Tidy - String Store
 **************************************************************************************/

module.exports = function (app, config) {

	return {
		welcome:	"\n+======================================================================+\n" +
					"\n -+ SPLITSCREEN API NODEJS EXPRESS SERVER" +
					"\n     -+ BY NONA CREATIVE\n" +
					"\n Environment:\t" + app.get('env') +
					"\n Rootdir:\t" + config.root +
					"\n\n+======================================================================+\n"
	};

};
