XPI := zotero-maps


html:
	rst2html README.rst README.html

all:
	rm -f $(XPI).xpi
	zip -9r $(XPI).xpi chrome chrome.manifest  install.rdf
