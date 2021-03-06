﻿(function () {
	var worker;

	/**
	 * @param {Event} e
	 * @this HTMLAnchorElement
	 */
	function getShapefileZip() {
		worker.postMessage(this.dataset.itemId + ".zip");
		this.classList.add("busy");
		var statusSpan = this.nextSibling;
		["fa", "fa-cog", "fa-spin"].forEach(function (cls) {
			statusSpan.classList.add(cls);
		}); 
		return false;
	}

	function createListItem(item) {
		var li = document.createElement("li");
		var a = document.createElement("a");
		a.href = [qsParameters.url, "datasets", item.id].join("/") + ".zip";
		a.textContent = item.item_name;
		a.target = "OpenDataShapefile";
		a.dataset.itemId = item.id;
		a.dataset.ext = ".zip";
		a.onclick = getShapefileZip;
		li.appendChild(a);
		var span = document.createElement("span");
		span.setAttribute("class", "status-icon");
		li.appendChild(span);
		return li;
	}

	function createList(items) {
		var ul = document.createElement("ul");
		items.forEach(function (item) {
			ul.appendChild(createListItem(item));
		});
		return ul;
	}

	function getQSParameters() {
		var qs, output = {};
		if (location.search) {
			qs = location.search.replace(/^\?/, "");
			qs = qs.split("&");
			qs.forEach(function (kvp) {
				kvp = kvp.split("=");
				var key = kvp[0], value = decodeURIComponent(kvp[1]);
				output[key] = value;
			});
		}

		return output;
	}

	var qsParameters = getQSParameters();
	var progressBar;

	if (qsParameters.url) {
		document.getElementById("urlBox").value = qsParameters.url;
		// Add progress bar
		progressBar = document.createElement("progress");
		progressBar.textContent = "Loading data...";
		document.body.appendChild(progressBar);

		// Load data
		worker = new Worker("../OpenDataWorker.js");
		worker.addEventListener("message", function (e) {
			var message, a, statusSpan;
			if (e.data.message) {
				message = e.data.message;
				if (message === "download complete") {
					////window.open(e.data.url, "OpenDataShapefile");
					a = document.body.querySelector("[data-item-id='" + e.data.id + "']");
					statusSpan = a.nextSibling;
					["fa-cog", "fa-spin"].forEach(function (cls) {
						statusSpan.classList.remove(cls);
					});
					statusSpan.classList.add("fa-check");
					a.classList.add("complete");
					a.classList.remove("busy");
					a.onclick = null;
					a.href = e.data.url;
					a.click();
				} else if (message === "data loaded") {
					document.body.removeChild(progressBar);
					document.body.appendChild(createList(e.data.data));
				}
			}
		});
		worker.postMessage(qsParameters.url);
		worker.postMessage("load all data");
	}


}());