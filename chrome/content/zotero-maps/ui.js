var map, markers, loadingPanel, items_to_load = 0;
var llproj = new OpenLayers.Projection("EPSG:4326");
var googproj = new OpenLayers.Projection("EPSG:900913");

var Feature = OpenLayers.Class(OpenLayers.Feature, {
    popupClass: OpenLayers.Popup.FramedCloud,
    mouseDown: function (evt) {
        var existing = map.popups[0];
        if (existing && existing.feature == this) {
            map.removePopup(existing);
        } else { 
            /* BUG? Where's the popup close button? */
            var popup = this.createPopup(true);
            var html = '<b>'+this.data.name+'</b> ('+this.data.items.length+')<hr />';
            for (var i = 0; i<this.data.items.length; i++) {
                var item = this.data.items[i];
                /* FIXME: this is really ugly and should be refactored somehow */
                html +='<div style="margin-left:24px; font-size:small">'
                        +'<img src="' + item.typeIcon + '" style="margin-left:-24px; margin-top:4px;" /> '
                        +'<a href="zotero://select/item/' + item.id + '">'
                        + item.title + '</a>'
                        + '</div>';
            }
            popup.feature = this;
            popup.setContentHTML(html);
            map.addPopup(popup,true);
        }
        OpenLayers.Event.stop(evt);
        return true;
    } 
});

function get_items_from_zotero () {
    var path = window.location.pathname.split("/");
    var type = path[1];
    var ids  = path[2];
    var results;
    switch (type) {
        case 'collection':
            var col = Zotero.Collections.get(ids);
            results = col.getChildItems();
            break;
        case 'search':
            var s = new Zotero.Search(ids);
            ids = s.search();
            break;
        case 'selection':
            ids = Zotero.Maps.selection();
            break;
        default:
            type = 'library';
            var s = new Zotero.Search();
            s.addCondition('noChildren', 'true');
            ids = s.search();
    }
    if (!results) {
        var results = Zotero.Items.get(ids);
    }
    var items = [];
    // Only include parent items
    for (var i = 0; i < results.length; i++) {
        if (!results[i].getSource()) {
            items.push(results[i]);
        }
    }
      	
    return items;
}  

function add_item_to_features (item, geoname, features) {
    var loc = new OpenLayers.LonLat(geoname.lng, geoname.lat);
    var key = loc.toShortString();
    loc.transform(llproj,googproj);

    /* Key Zotero items by lat/lon so that citations can be
     * grouped by location. */

    if (!features[key]) {
        var feature = new Feature(markers, loc, {name:geoname.name, items:[]});
        var marker = feature.createMarker();
        markers.addMarker(marker);
        marker.events.register("mousedown", feature, feature.mouseDown);
        features[key] = feature;
    }
    var citation = {
       title: item.getDisplayTitle(),
       id: item.getID(),
       type: item.getType(),
       typeIcon: item.getImageSrc()
    };
    features[key].data.items.push(citation);
};

function lookup_item_for_features (item, placename, features) {
    /* If we have the placename cached, use the cached result;
     * Otherwise, call the geonames search service. */
    var geoname = Zotero.Maps.get(placename);
    if (geoname) {
        /* Is the location known? */
        if (geoname.lat != 0.0 && geoname.lng != 0.0) {
            add_item_to_features(item, geoname, features);
        }
    } else {
        if (!items_to_load) {
            // console.log("loadingPanel visible");
            loadingPanel.setVisible(true);
        }
        // console.log("++items to load:" + items_to_load);
        items_to_load++;
        Zotero.Map.query(item, geoname, function (item, geoname) {
            items_to_load--;
            // console.log("--items to load:" + items_to_load);
            if (!items_to_load) {
                // console.log("loadingPanel hidden");
                loadingPanel.setVisible(false);
            }
            add_item_to_features(item, geoname, features);
        });
    }
}

function populate_map (field, max_items) {
    var items = get_items_from_zotero();
    var features = {};
    if (items.length > max_items) {
        alert("Found " + items.length + " matching items; "
              + "only displaying the first " + max_items + ".");
    } else {
        max_items = items.length;
    }
    for(var j=0; j<max_items; j++) {
        var placeName = items[j].getField(field);
        if (!placeName) continue;
        lookup_item_for_features(items[j], placeName, features);
    }
}

function osm_getTileURL(bounds) {
    var res = this.map.getResolution();
    var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
    var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
    var z = this.map.getZoom();
    var limit = Math.pow(2, z);
 
    if (y < 0 || y >= limit) {
        return OpenLayers.Util.getImagesLocation() + "blank.gif";
    } else {
        x = ((x % limit) + limit) % limit;
        return this.url + z + "/" + x + "/" + y + "." + this.type;
    }
}

function onLoad() {
    // avoid pink tiles
    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
    OpenLayers.Util.onImageLoadErrorColor = "white";

    loadingPanel = new OpenLayers.Control.LoadingPanel();
    var options = {
          projection: googproj,
          displayProjection: llproj,
          units: "m",
          maxResolution: 156543,
          maxExtent: new OpenLayers.Bounds(-20037508, -20037508, 20037508, 20037508),
          numZoomLevels: 12,
          controls: [
            new OpenLayers.Control.PanZoomBar(),
            new OpenLayers.Control.KeyboardDefaults(),
            new OpenLayers.Control.Navigation(),
            new OpenLayers.Control.Attribution(),
            loadingPanel
          ],
          //style:null
    };

    map = new OpenLayers.Map('map', options);

    /*** Google Maps won't work without a license key...
    * and Google doesn't give them out for zotero:// or chrome:// APIs...
    var gmap = new OpenLayers.Layer.Google( "Map" , {
        type: G_NORMAL_MAP, sphericalMercator:true,'maxZoomLevel':12});
    */

    // create OSM layer
    var mapnik = new OpenLayers.Layer.TMS(
        "OpenStreetMap (Mapnik)",
        "http://tile.openstreetmap.org/",
        {
            type: 'png', getURL: osm_getTileURL,
            displayOutsideMaxExtent: true,
            attribution: 'Map provided by ' +
                    '<a href="http://www.openstreetmap.org/">OpenStreetMap</a>',
            transitionEffect: 'resize',
            //wrapDateLine: true
        }
    );

    markers = new OpenLayers.Layer.Markers("markers");
    map.addLayers([mapnik, markers]);

    populate_map("place", 100);
    map.zoomToMaxExtent();
}

