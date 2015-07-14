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

	function createListFragment(items) {
		var frag = document.createDocumentFragment();
		items.forEach(function (item) {
			frag.appendChild(createListItem(item));
		});
		return frag;
	}

	/**
	 * Creates an object representing the query string parameters.
	 * @returns {Object}
	 */
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

	function loadDataFromOpenData(messageEvent) {
		var a = document.body.querySelector("[data-item-id='" + messageEvent.data.id + "']");
		var statusSpan = a.nextSibling;
		["fa-cog", "fa-spin"].forEach(function (cls) {
			statusSpan.classList.remove(cls);
		});
		statusSpan.classList.add("fa-check");
		a.classList.add("complete");
		a.classList.remove("busy");
		a.onclick = null;
		a.href = messageEvent.data.url;
		a.click();
	}

	function populatePageLinks(metadata) {
		var stats = metadata.stats;
		var total_count = stats.total_count;
		var per_page = metadata.query_parameters.per_page;
		// Calculate the total number of pages.
		var page_count = Math.ceil(total_count / per_page);

		for (var i = 0; i < page_count; i++) {
			// TODO: Create links to other pages of results.
		}
	}

	function handleSearchResults(messageEvent) {
		var results = messageEvent.data.results;
		if (progressBar) {
			document.body.removeChild(progressBar);
		}

		var pageList = document.getElementById("pageList");
		if (pageList.childElementCount === 0) {
			populatePageLinks(results.metadata);
		}
		list.appendChild(createListFragment(results.data));
	}

	var qsParameters = getQSParameters();
	var progressBar;

	if (qsParameters.url) {
		document.getElementById("urlBox").value = qsParameters.url;
		// Add progress bar
		progressBar = document.createElement("progress");
		progressBar.textContent = "Loading data...";
		document.body.appendChild(progressBar);

		// Setup the worker that will communicate with Open Data portal.
		worker = new Worker("../OpenDataWorker.js");
		// Add event handler method for when messages are received from the worker.
		worker.addEventListener("message", function (e) {
			console.debug("message received", e.data);
			if (e.data.type) {
				if (e.data.type === "search page" && e.data.results) {
					handleSearchResults(e);
				} else if (e.data.type === "download complete") {
					loadDataFromOpenData(e);
				}
			}
		});

		// Set the Worker's OpenData object's URL.
		worker.postMessage(qsParameters.url);
		// Query for a page of data.
		worker.postMessage({
			per_page: 20,
			bbox: "-116.91,45.54,-124.79,49.05",
			sort_by: "name"
		});
	}


}());