
/**************************************************************************************
 *	Routing Configuration
 **************************************************************************************/

module.exports = function(app, config) {

	/**************************************************************************************
	 *	Routes for API
	 **************************************************************************************/

	var Wordpress = require('../providers/wordpress');
	var provider = new Wordpress();

	/* Enable CORS */
	app.all('*',

		function(req, res, next) {

			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "X-Requested-With, Screen");
			next();

		});

	 /* API GETs */
	app.get('/v1/:type',

		function(req, res) {

			// return error if screen info doesn't exist
			if(!req.get('Screen')) return res.status(403).end();

			var screen_id = JSON.parse(req.get('Screen')).ID;
			var type = req.params.type;

			if(type === 'posts') {

				try {
					provider.getPosts(req.query, function(err, posts) {
						res.json(posts);
					});
				} catch(err) {
					console.log('Error getting posts - query(' + req.query + '): ' + err);
				}


			}

			else if(type === 'users') {

				// always append screen ID to the query
				req.query.ID = screen_id;

				try {
					provider.getUsers(req.query, function(err, users) {
						res.json(users);
					});
				} catch(err) {
					console.log('Error getting users - query(' + req.query + '): ' + err);
				}

			}
		});
};