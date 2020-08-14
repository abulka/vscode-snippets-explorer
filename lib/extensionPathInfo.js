const path = require("path");
const { snippetKindToNiceName } = require('./snippet_kind')

class ExtensionPathInfo {
    constructor(fullPath) {
        this.fullPath = fullPath;
        // this.extensionShortPath;
        this.extensionId;
        this.extensionVersion;
        this.basename;
        this.analyse();
    }

    analyse() {
        let match = this.fullPath.match(/.*\/extensions\/(.*?)-?([\d\.]*)\/snippets\/(.*)/); // https://regex101.com/r/PHcfdb/3
        if (match != null) {
            this.extensionId = match[1]; // e.g. 'ms-python.python'
            this.extensionId = this.extensionId.replace(/^\./, '') // remove any leading . char
            this.extensionVersion = match[2]; // e.g. '2020.7.96456'
            this.basename = match[3]; // e.g. 'python.json'
            console.assert(this.basename == path.basename(this.fullPath))
        }
        else {
            // console.warn(`Could not regex match path ${this.fullPath}`)
            let basename = path.basename(this.fullPath)
            this.extensionId = basename
            this.extensionVersion = ''
            this.basename = basename
        }
    }
}

/**
 * Create meta entry, for various uses. Display of tree label and esp. for
 * use by the removeOutdatedExtensions() algorithm v2.
*/
function createMetaEntry(snippetsDict, languageId, kind, fullPath) {
    snippetsDict["_meta_"] = {
        languageId: languageId,
        kind: kind,
        kindNiceName: snippetKindToNiceName(kind),
        extensionPathInfo: new ExtensionPathInfo(fullPath)
    }
}


exports.ExtensionPathInfo = ExtensionPathInfo
exports.createMetaEntry = createMetaEntry