XPI := zotero-maps

all:
	rm -f $(XPI).xpi
	find | grep -Ev '\.svn|\.xpi|\.swp|~|Makefile' | zip $(XPI).xpi -@
