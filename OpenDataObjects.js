/*global define, module*/
// if the module has no dependencies, the above pattern can be simplified to
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory();
	} else {
		// Browser globals (root is window)
		root.OpenDataObjects = factory();
	}
}(this, function () {

	var exports = {};

	/**
	 * Function used for JSON deserialization.
	 * @param {string} k
	 * @param {*} v
	 */
	exports.reviver = function (k, v) {
		var datePropertyRe = /(?:(?:updated)|(?:created))_at/;
		if (k === "metadata") {
			return new exports.Metadata(v);
		} else if (datePropertyRe.test(k) && typeof v === "string") {
			return new Date(v);
		} else {
			return v;
		}
	};

	exports.QueryParameters = function (json) {
		this.bbox = json.bbox || null;
		this.page = json.page || null;
		this.per_page = json.per_page || null;
		this.q = json.q || null;
		this.required_keywords = json.required_keywords || null;
		this.sort_by = json.sort_by || null;
		this.sort_order = json.sort_order || null;
	};

	exports.Stats = function (json) {
		this.count = json.count || 0;
		this.top_tags = json.top_tags || null;
		this.total_count = json.total_count || 0;
	};

	exports.Metadata = function (json) {
		this.query_parameters = json.query_parameters ? new exports.QueryParameters(json.query_parameters) : null;
		this.stats = json.stats ? new exports.Stats(json.stats) : null;

		Object.defineProperties(this, {
			page_count: {
				get: function () {
					return Math.ceil(this.stats.total_count / this.query_parameters.per_page);
				}
			}
		});
	};

	// Just return a value to define the module export.
	// This example returns an object, but the module
	// can return a function as the exported value.
	return exports;
}));