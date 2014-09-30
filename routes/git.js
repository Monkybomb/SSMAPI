
/**************************************************************************************
 *	Routing Configuration
 **************************************************************************************/

module.exports = function(app, config) {

	/**************************************************************************************
	 *	Routes for git automation
	 **************************************************************************************/

	var exec = require('child_process').exec;

	// Automate pull when remote changes
	app.post('/git',

		function(req, res) {

			try {
				var payload = JSON.parse(req.body.payload);
				if(payload && payload.commits.length > 0) {
					exec('git pull', function (error, stdout, stderr) {
						console.log("git: " + stdout);
					});
				}
			} catch (err) {
				console.log(err);
			}
			res.status(200).end();

		});

};