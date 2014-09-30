
/**************************************************************************************
 *	Routing Configuration
 **************************************************************************************/

module.exports = function(app, config) {

	/**************************************************************************************
	 *	Routes for mailer
	 **************************************************************************************/

	var mailHelper = require('../helpers/mailHelper');

	// Sends contact emails from listing pages
	app.post('/v1/splitscreenmailer',

		function(req, res) {

			// return error if screen info doesn't exist
			if(!req.get('Screen')) return res.status(403).end();

			var details = {
				name: req.param('name') || "Somebody",
				email: req.param('email') || "no email given",
				phone: req.param('phone') || "no number given",
				message: req.param('message') || "no message",
				company_name: req.param('company_name') || "there",
				company_email: req.param('company_email')
			};

			try {
				mailHelper.emailContact(details, function(err) {
					if(err) {
						console.log(err);
						return res.json({result: "failed"});
					}
				});
			} catch (err) {
				console.log(err);
				return res.json({result: "failed"});
			}
			res.json({result: "success"});

		});

};