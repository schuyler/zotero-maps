Zotero.Maps = {
    SCHEME: "zotero://maps",
    
    channel: {
        CONTENT_URI: "chrome://zotero-maps/content/ui.html",
        newChannel: function (uri) {
            var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                                      .getService(Components.interfaces.nsIIOService);
            try {
                var ext_uri = ioService.newURI(this.CONTENT_URI, null, null);
                var extChannel = ioService.newChannelFromURI(ext_uri);
                return extChannel;
            }
            catch (e){
                Zotero.debug(e);
                throw (e);
            }
        }
    },

    loaded: false,

    DB: null,
    
    init: function () {
        var protocol = Components.classes["@mozilla.org/network/protocol;1?name=zotero"]
                                 .getService(Components.interfaces.nsIProtocolHandler)
                                 .wrappedJSObject;
        protocol._extensions[this.SCHEME] = this.channel;

        this.DB = new Zotero.DBConnection('geonames');
        
        if (!this.DB.tableExists('location')) {
            this.DB.query("CREATE TABLE location " +
                          " (lng NUMERIC, lat NUMERIC, name VARCHAR(255))");
        }
    },

    get: function (loc) {
        var place = loc.replace("\"", "\\\"");
        return this.DB.rowQuery("SELECT * FROM location WHERE name = \"" + place + "\"");
    },

    set: function (loc, lng, lat) {
        if (!this.get(loc)) {
            /* this is workaround for an apparent bug where passing a
             * float to a placeholder casts it to an integer?? */
            var place = loc.replace("\"", "\\\"");
            this.DB.query("INSERT INTO location (lng,lat,name) VALUES " +
                            "(" + lng + "," + lat + ", \"" + place + "\")");
        }
    },
    
    load: function() {
        var uri = "";
        var id = ZoteroPane.getSelectedItems(true);
        if (id != "") { 
            uri = this.SCHEME + '/selection/'
        } else{ 
            id = ZoteroPane.getSelectedCollection(true);
            if (id) {
                uri = this.SCHEME + '/collection/' + id;
            } else { 
                id = ZoteroPane.getSelectedSavedSearch(true);
                if (id) {
                    uri = this.SCHEME + '/search/' + id;
                } else {
                    uri = this.SCHEME + '/library/';
                }
            }
        } 
        if (uri) {
            window.loadURI(uri);
        } else {
            // var str = document.getElementById('zotero-maps-strings')
            //                  .getFormattedString("zoteromaps.noneSelected");
            var str = "No collection is selected.";
            alert(str);
        }
    },

    selection: function () {
        return ZoteroPane.getSelectedItems(true);
    }
};

window.addEventListener('load', function(e) { Zotero.Maps.init(); }, false);
