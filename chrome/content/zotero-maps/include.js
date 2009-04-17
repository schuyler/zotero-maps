var Zotero = Components.classes["@zotero.org/Zotero;1"]
                       .getService(Components.interfaces.nsISupports)
                       .wrappedJSObject;

// Only create main object once
if (!Zotero.Maps) {
    const loader_m = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                             .getService(Components.interfaces.mozIJSSubScriptLoader);
    loader_m.loadSubScript("chrome://zotero-maps/content/setup.js");
}
