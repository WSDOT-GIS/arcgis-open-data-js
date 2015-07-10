/*global self, OpenData*/
self.importScripts("../OpenData.js");

var openData;

function requestData(id, ext) {
	var url = [openData.url, "datasets", [id, ext].join(".")].join("/");
	url += "?url_only=true";
	var self = this;
	var request = new XMLHttpRequest();
	request.open("get", url);
	request.addEventListener("loadend", function () {
		var result;
		if (this.status === 202) {
			// Resend the request.
			self.setTimeout(self.requestData, 1000, id, ext);
		} else if (this.status === 200) {
			result = JSON.parse(this.response);
			self.postMessage({
				message: "download complete",
				id: id,
				url: result.url.replace(/\?$/,"")
			});
		}
	});
	request.send();
}

self.addEventListener("message", function (message) {
	// Load data
	var urlRe = /(https?\:)?\/\//;
	var idRe = /^([0-9a-f]+_[0-9a-f])(?:\.(\w+))?$/i;
	var match;
	if (typeof message.data === "string") {
		match = message.data.match(idRe);
		if (match) {
			requestData(match[1], match[2]);
		}
		else if (urlRe.test(message.data)) {
			openData = new OpenData(message.data);
		} else if (message.data === "load all data") {
			openData.getDataPages({
				sort_by: "name"
			}).then(function (dataItems) {
				self.postMessage({
					message: "data loaded",
					data: dataItems
				});
			}, function (error) {
				self.postMessage({
					message: "load all data error",
					error: error
				});
			});
		}
	}
});