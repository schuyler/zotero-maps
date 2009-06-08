XPI := zotero-maps

all:
	rm -f $(XPI).xpi
	zip -9r $(XPI).xpi chrome chrome.manifest  install.rdf

html:
	rst2html README.rst README.html

