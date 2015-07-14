(function () {
	var worker, list;

	list = document.getElementById("itemList");

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
		var frag = document.createDocumentFragment();
		items.forEach(function (item) {
			frag.appendChild(createListItem(item));
		});
		return frag;
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
			console.debug("message received", e);
			var a, statusSpan;
			if (e.data.type) {
				if (e.data.type === "search page" && e.data.results) {
					if (progressBar) {
						document.body.removeChild(progressBar);
					}

					list.appendChild(createList(e.data.results.data));
				} else if (e.data.type === "download complete") {
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
				}
			}
		});
		worker.postMessage(qsParameters.url);
		worker.postMessage({
			per_page: 20,
			bbox: "-116.91,45.54,-124.79,49.05"
		});
	}


}());