var Zotero = Components.classes["@zotero.org/Zotero;1"]
                       .getService(Components.interfaces.nsISupports)
                       .wrappedJSObject;

// Only create main object once
if (!Zotero.Maps) {
    const loader_m = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                             .getService(Components.interfaces.mozIJSSubScriptLoader);
    /* need to load OpenLayers first in order to get .loadURL and .Format.JSON */
    loader_m.loadSubScript("chrome://zotero-maps/skin/OpenLayers.js");
    loader_m.loadSubScript("chrome://zotero-maps/content/setup.js");
}
