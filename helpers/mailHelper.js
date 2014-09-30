
/**************************************************************************************
 *	Module Dependencies
 **************************************************************************************/

var nodeMailer = require("nodemailer");


/**************************************************************************************
 *  Mail Helper Functions
 **************************************************************************************/

module.exports = {

	emailContact: function(details, callback) {

		// make sure email addresses are valid
		if(!this.verifyEmail(details.company_email) ||
			!this.verifyEmail(details.email)) {
			console.log("Error: Invalid email address in [" + details.company_email + ", " + details.email + "]");
			return callback("Invalid email address");
		}

		var transport = nodeMailer.createTransport({
			service: 'Gmail',
			auth: {
				user: "splitscreenmailer@gmail.com",
				pass: "ZthcxjQJvUi9duYZRIdW"
			}
		});

		var message = {
			from: "Splitscreen Mailer <splitscreenmailer@gmail.com>", // sender address
			to: details.company_email, // Comma seperated list of receivers
			subject: "Splitscreen Contact!", // Subject line
			headers: { 'X-Laziness-level': 1000	},
			html: "<p> <strong> Hi " + details.company_name + "!</strong> </p>" +
					"<p> " + details.name + " got hold of you using <i>Splitscreen</i>. <br>" +
					"Respond using their contact number or by clicking their email address below. </p>" +
					"<p> <strong>Message:</strong>  " + details.message + " <br>" +
					"<strong>Email:</strong> <a href='mailto:" + details.email + "?subject=" + encodeURIComponent(details.company_name) + " Response' target='_blank'>" + details.email + " </a><br>" +
					"<strong>Phone:</strong> " + details.phone + " </p>" +
					"<p> Regards,<br><i>Splitscreen</i> </p>"
		};

		transport.sendMail(message, function(err) {
			if(err) return callback(err);
			transport.close(); // shut down the connection pool, no more messages
			callback();
		});
	},

	verifyEmail: function(email) {
		var email_regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return email_regex.test(email);
	}
};