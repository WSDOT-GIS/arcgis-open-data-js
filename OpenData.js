/*global module, define*/
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
		root.OpenData = factory();
	}
}(this, function () {
	/**
	 * OpenData module
	 * @module OpenData
	 */

	/**
	 * A class used for querying ArcGIS Open Data.
	 * @param {string} [url="http://opendata.arcgis.com/"]
	 * @constructor
	 * @alias module:OpenData
	 */
	var OpenData = function (url) {
		this._url = url || "http://opendata.arcgis.com/";

		Object.defineProperties(this, {
			url: {
				get: function () {
					return this._url;
				}
			}
		});
	};

	/**
	 * @typedef {Object} QueryOptions
	 * @property {number} [page=1] - The page number
	 * @property {number} [per_page=100] - Maximum value is 100
	 * @property {string} [sort_by]

	 */

	/**
	 * Queries for a page of data items.
	 * @param {QueryOptions} options
	 * @returns {Promise}
	 */
	OpenData.prototype.getDataPage = function (options) {
		var self = this;
		var datasetsUrl = [self.url, "datasets.json"].join("/");
		if (!options) {
			options = {};
		}

		function optionsToQueryString(options) {
			var output = [], value;
			for (var name in options) {
				if (options.hasOwnProperty(name)) {
					value = options[name];
					output.push([name, value].join("="));
				}

			}
			return output.join("&");
		}

		options.page = options.page || 1;
		options.per_page = options.per_page || 100;
		var queryString = optionsToQueryString(options);
		datasetsUrl += "?" + queryString;
		var promise = new Promise(function (resolve, reject) {
			var datasetsRequest = new XMLHttpRequest();
			datasetsRequest.open("get", datasetsUrl);
			datasetsRequest.onloadend = function () {
				var datasetsResponse;
				if (this.status === 200) {
					datasetsResponse = JSON.parse(this.response, OpenData.reviver);
					resolve(datasetsResponse);
				} else {
					reject(this.response);
				}
			};
			datasetsRequest.send();
		});

		return promise;
	};

	/**
	 * Queries for ALL data items in the Open Data portal.
	 * This function will call {@link:OpenData#getDataPage} multiple times until all items' metadata has been retrieved.
	 * @param {QueryOptions} options
	 * @returns {Promise}
	 */
	OpenData.prototype.getDataPages = function (options) {
		var self = this;
		if (!options) {
			options = {};
		}
		var promise = new Promise(function (resolve, reject) {
			self.getDataPage(options).then(function (datasetsPage) {
				var metadata, total_count, per_page, total_pages;
				metadata = datasetsPage.metadata;
				per_page = metadata.query_parameters.per_page;
				total_count = metadata.stats.total_count;
				total_pages = Math.round(total_count / per_page);

				var promises = [];

				for (var i = 2; i <= total_pages; i++) {
					options.page = i;
					promises.push(self.getDataPage(options));
				}

				Promise.all(promises).then(function (pages) {
					var data;
					pages = [datasetsPage].concat(pages);
					pages.forEach(function (page) {
						if (!data) {
							data = page.data;
						} else {
							data = data.concat(page.data);
						}
					});
					resolve(data);
				}, function (error) {
					reject(error);
				});
			}, function (error) {
				reject(error);
			});
		});
		return promise;
	};

	/**
	 * Function used for JSON deserialization.
	 * @param {string} k
	 * @param {*} v
	 */
	OpenData.reviver = function (k, v) {
		var datePropertyRe = /(?:(?:updated)|(?:created))_at/;
		if (datePropertyRe.test(k) && typeof v === "string") {
			return new Date(v);
		} else {
			return v;
		}
	};

	// Just return a value to define the module export.
	// This example returns an object, but the module
	// can return a function as the exported value.
	return OpenData;
}));