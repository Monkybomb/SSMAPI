
/**************************************************************************************
 *  Module Dependencies
 **************************************************************************************/

var mysql = require('mysql');
var config = require('../config/general').wp_mysql;
var _ = require('underscore');


/**************************************************************************************
 *  Wordpress Provider
 **************************************************************************************/

var wp_prefix = config.wp_prefix;


WordpressProvider = function() {

	try {
		this.pool = mysql.createPool(config);
	} catch(err) {
		console.log('Error creating mysql pool: ' + err);
	}

};


WordpressProvider.prototype.getPosts= function(options, callback) {

	var defaults = {
		'post_ids'         : 0,
		'post_author'      : 0,
		'posts_per_page'   : 0,
		'offset'           : 0,
		'taxonomy'         : '',
		'term_name'        : '',
		'orderby'          : 'post_date',
		'order'            : 'DESC',
		'include'          : '',
		'exclude'          : '',
		'meta_key'         : '',
		'meta_value'       : '',
		'post_type'        : '',
		'post_mime_type'   : '',
		'post_parent'      : '',
		'post_status'      : (options.post_type=='attachment')?'inherit':'publish',
		'suppress_filters' : true
	};

	var opts = _.extend(defaults, options);

	// Do the get posts query and return result as json
	this.pool.getConnection(function(err, connection) {

		if(err) throw err;

		/*
			All Fields:	ID,post_author,post_date,post_date_gmt,post_content,post_title,post_excerpt,post_status,
						comment_status,ping_status,post_password,post_name,to_ping,pinged,post_modified,post_modified_gmt,
						post_content_filtered,post_parent,guid,menu_order,post_type,post_mime_type,comment_count,meta_id,
						post_id,meta_key,meta_value,object_id,term_relationships.term_taxonomy_id,term_order,
						term_taxonomies.term_taxonomy_id,term_taxonomies.term_id,taxonomy,description,parent,
						count,terms.term_id,name,slug,term_group
		*/
		sql =	"SELECT ID,post_author,post_date,post_date_gmt,post_content,post_title,post_excerpt,post_status," +
						"comment_status,ping_status,post_password,post_name,to_ping,pinged,post_modified,post_modified_gmt," +
						"post_content_filtered,post_parent,guid,menu_order,post_type,post_mime_type,comment_count,meta_id," +
						"post_id,meta_key,meta_value,object_id,term_relationships.term_taxonomy_id,term_order,term_taxonomies.term_taxonomy_id,term_taxonomies.term_id,taxonomy," +
						"description,parent,count,terms.term_id,name,slug,term_group FROM " + wp_prefix + "posts AS posts " +
					"LEFT JOIN " + wp_prefix + "postmeta AS meta ON posts.ID=meta.post_id " +
					"LEFT JOIN " + wp_prefix + "term_relationships AS term_relationships ON posts.ID=term_relationships.object_id " +
					"LEFT JOIN " + wp_prefix + "term_taxonomy AS term_taxonomies ON term_relationships.term_taxonomy_id=term_taxonomies.term_taxonomy_id " +
					"LEFT JOIN " + wp_prefix + "terms AS terms ON term_taxonomies.term_id=terms.term_id " +
					"WHERE 1=1" +
					(opts.post_type? " AND posts.post_type = " + mysql.escape(opts.post_type) : "") +
					(opts.post_parent? " AND posts.post_parent = " + mysql.escape(opts.post_parent) : "") +
					(opts.post_status? " AND posts.post_status = " + mysql.escape(opts.post_status) : "") +
					(opts.post_ids? " AND posts.ID IN (" + mysql.escape(opts.post_ids.split(',')) + ")" : "") +
					" AND posts.post_date <= (NOW() - INTERVAL 2 MINUTE)"; // only return posts older than 6 hours

		if(opts.meta_key || opts.meta_value || opts.taxonomy) {
			sql +=	" AND posts.ID IN (SELECT temp_posts.ID FROM " + wp_prefix + "posts AS temp_posts";
							if(opts.meta_key || opts.meta_value) {
								sql +=	" INNER JOIN " + wp_prefix + "postmeta AS temp_meta" +
										" ON temp_posts.ID=temp_meta.post_id" +
										(opts.meta_key? " AND temp_meta.meta_key = " + mysql.escape(opts.meta_key) : "") +
										(opts.meta_value? " AND temp_meta.meta_value = " + mysql.escape(opts.meta_value) : "");
							}
							if(opts.taxonomy) {
								sql +=	" INNER JOIN " + wp_prefix + "term_relationships AS temp_term_relationships" +
										" ON temp_posts.ID=temp_term_relationships.object_id " +

										" INNER JOIN " + wp_prefix + "term_taxonomy AS temp_term_taxonomies" +
										" ON temp_term_relationships.term_taxonomy_id=temp_term_taxonomies.term_taxonomy_id " +

										" INNER JOIN " + wp_prefix + "terms AS temp_terms" +
										" ON temp_term_taxonomies.term_id=temp_terms.term_id " +
										(opts.taxonomy? " AND (temp_term_taxonomies.taxonomy = " + mysql.escape(opts.taxonomy) +
											" AND (temp_terms.name = " + (opts.term_name?mysql.escape(opts.term_name):"1 OR 1=1") + "))" : "");
							}
								sql +=	")";
		}

		sql +=	" ORDER BY " + mysql.escapeId(opts.orderby) + " " + ((['ASC', 'DESC'].indexOf(opts.order)>-1)?opts.order:"DESC");

		connection.query({ sql: sql, nestTables: true }, function(err, rows) {

			if(err)	return callback(err, null);

			var key_post = "posts";
			var key_postmeta = "meta";
			var key_taxonomy = "term_taxonomies";
			var key_terms = "terms";
			var post = false;
			var posts = [];

			// Do some nesting magic on the result
			_.each(rows, function(value, index) {

				var value_post = value[key_post];
				var value_postmeta = value[key_postmeta];
				var value_taxonomy = value[key_taxonomy];
				var value_terms = value[key_terms];

				if(!post || post.post.ID != value_post.ID) {

					if(post) {
						posts.push(post);
					}

					post = {};
					post.post = value_post;
					post.taxonomies = {};
					post.meta = {};

					if(value_postmeta.meta_key) {
						post.meta[value_postmeta.meta_key] = value_postmeta.meta_value;
					}
					if(value_taxonomy.taxonomy) {
						post.taxonomies[value_taxonomy.taxonomy] = value_terms.name || "";
					}

				} else {

					var post_meta = post.meta;
					var post_taxonomies = post.taxonomies;
					var existing_meta = post_meta[value_postmeta.meta_key];
					var existing_terms = post_taxonomies[value_taxonomy.taxonomy];

					// check if the meta tag exists
					if(value_postmeta.meta_key) {
						if(value_postmeta.meta_key in post_meta) {
							if(existing_meta instanceof Array) {
								if(existing_meta.indexOf(value_postmeta.meta_value) < 0) {
									existing_meta.push(value_postmeta.meta_value);
								}
							} else {
								if(existing_meta != value_postmeta.meta_value) {
									post_meta[value_postmeta.meta_key] = (existing_meta.length > 0) ? [existing_meta] : [];
									post_meta[value_postmeta.meta_key].push(value_postmeta.meta_value);
								}
							}
						} else {
							post_meta[value_postmeta.meta_key] = value_postmeta.meta_value;
						}
					}

					// check if the taxonomy tag exists and add term
					if(value_terms.name) {
						if(value_taxonomy.taxonomy in post_taxonomies) {
							if(existing_terms instanceof Array) {
								if(existing_terms.indexOf(value_terms.name) < 0) {
									existing_terms.push(value_terms.name);
								}
							} else {
								if(existing_terms != value_terms.name) {
									post_taxonomies[value_taxonomy.taxonomy] = (existing_terms.length > 0) ? [existing_terms] : [];
									post_taxonomies[value_taxonomy.taxonomy].push(value_terms.name);
								}
							}
						} else {
							post_taxonomies[value_taxonomy.taxonomy] = value_terms.name;
						}
					}
				}

				if(index==(rows.length-1) && post) {
					posts.push(post);
				}
			});

			// Simulate SQL limit after processing is done
			if(opts.posts_per_page > 0) {
				posts = posts.splice(0, opts.posts_per_page);
			}

			callback(null, posts);

			connection.release();

		});
	});
};


WordpressProvider.prototype.getUsers= function(options, callback) {

	var defaults = {
		'ID'           : 0,
		'role'         : '',
		'meta_key'     : '',
		'meta_value'   : '',
		'meta_compare' : '',
		'meta_query'   : [],
		'include'      : [],
		'exclude'      : [],
		'orderby'      : 'user_login',
		'order'        : 'ASC',
		'offset'       : '',
		'search'       : '',
		'number'       : 0,
		'count_total'  : false,
		'fields'       : 'all',
		'who'          : ''
	};

	var opts = _.extend(defaults, options);

	// Do the get posts query and return result as json
	this.pool.getConnection(function(err, connection) {

		if(err) throw err;

		/*
			All Fields:	ID,user_login,user_pass,user_nicename,user_email,user_url,user_registered,user_activation_key,user_status,
						display_name,umeta_id,user_id,meta_key,meta_value
		*/
		var sql =	"SELECT ID,user_login,user_nicename,user_email,user_url,user_registered,user_activation_key,user_status," +
						"display_name,umeta_id,user_id,meta_key,meta_value FROM " + wp_prefix + "users AS users " +
					"LEFT JOIN " + wp_prefix + "usermeta AS meta ON users.ID=meta.user_id " +
					"WHERE 1=1" +
					(opts.search? " AND (users.user_email LIKE " + mysql.escape("%" + opts.search + "%") +
						" OR users.display_name LIKE " + mysql.escape("%" + opts.search + "%") + ")" : "") +
					(opts.ID? " AND users.ID IN (" + mysql.escape((opts.ID.toString()).split(',')) + ")" : "");

		if(opts.role || opts.meta_key || opts.meta_value) {
			sql +=	" AND users.ID IN (SELECT temp.ID FROM " + wp_prefix + "users AS temp" +
										" INNER JOIN " + wp_prefix + "usermeta AS temp_meta" +
											" ON temp.ID=temp_meta.user_id" +
											(opts.role? " AND (temp_meta.meta_key = '" + wp_prefix + "capabilities'" +
												" AND temp_meta.meta_value LIKE " + mysql.escape("%" + opts.role + "%") + ")" : "") +
											(opts.meta_key? " AND temp_meta.meta_key = " + mysql.escape(opts.meta_key) : "") +
											(opts.meta_value? " AND temp_meta.meta_value = " + mysql.escape(opts.meta_value) : "") +
										")";
		}

		sql +=	" ORDER BY " + mysql.escapeId(opts.orderby) + " " + ((['ASC', 'DESC'].indexOf(opts.order)>-1)?opts.order:"DESC");

		connection.query({ sql: sql, nestTables: true }, function(err, rows) {

			if(err)	return callback(err, null);

			var key_user = "users";
			var key_usermeta = "meta";
			var user = false;
			var users = [];

			// Do some nesting magic on the result
			_.each(rows, function(value, index) {

				var value_user = value[key_user];
				var value_usermeta = value[key_usermeta];

				if(!user || user.user.ID != value_user.ID) {

					if(user) {
						users.push(user);
					}

					user = {};
					user.user = value_user;
					user.meta = {};

					if(value_usermeta.meta_key) {
						user.meta[value_usermeta.meta_key] = value_usermeta.meta_value;
					}

				} else {

					var user_meta = user.meta;
					var existing_meta = user_meta[value_usermeta.meta_key];

					// check if the meta tag exists
					if(value_usermeta.meta_key) {
						if(value_usermeta.meta_key in user_meta) {
							if(existing_meta instanceof Array) {
								if(existing_meta.indexOf(value_usermeta.meta_value) < 0) {
									existing_meta.push(value_usermeta.meta_value);
								}
							} else {
								if(existing_meta != value_usermeta.meta_value) {
									user_meta[value_usermeta.meta_key] = (existing_meta.length > 0) ? [existing_meta] : [];
									user_meta[value_usermeta.meta_key].push(value_usermeta.meta_value);
								}
							}
						} else {
							user_meta[value_usermeta.meta_key] = value_usermeta.meta_value;
						}
					}
				}

				if(index==(rows.length-1) && user) {
					users.push(user);
				}
			});

			// Simulate SQL limit after processing is done
			if(opts.number > 0) {
				users = users.splice(0, opts.number);
			}

			callback(null, users);

			connection.release();

		});
	});
};

module.exports = WordpressProvider;