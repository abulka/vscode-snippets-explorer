const { appLog } = require("../app_logger");
const { SnippetKind } = require("../snippet_kind");

/**
  Remove duplicate extension snippets, we detect the later extension using an algorithm
  and delete the outdated snippet entries.
  When vscode extensions update themselves, they often leave their old extension directory
  hanging around, including snippet dir - which gets picked up by the snippet scanning.

  Reminder, our snippetTree looks like:

    {
      "python": {
        "/Users/andy/.vscode/extensions/ms-python.python-2019.6.96456/snippets/python.json": {  <- one snippet json file found
          "_meta_": {
            "languageId": "python",
            "kind": 1,
            "kindNiceName": "EXTENSION",
            "extensionPathInfo": {
              "fullPath": "/Users/andy/.vscode/extensions/ms-python.python-2019.6.96456/snippets/python.json",
              "extensionId": "ms-python.python",
              "extensionVersion": "2019.6.96456",
              "basename": "python.json"
            }            
          }
          "name1": {
            "prefix": "prefix1",
            "body": [],
            "description": "description1"
          },
          "name2": {
            "prefix": "prefix2",
            "body": [],
            "description": "description2"
          }
        },
      }
    }

    Overview
    --------

    The temporary grouping object is comprused of the 'meta' entries from the snippetTree, and is used to sort out the duplicates.
    Then we remove the outdated snippets from the real snippetTree, then discard the temporary grouping object.
    The meta entries in snippetTree must have correct "extensionPathInfo" fields esp. "extensionVersion" because we use this 
    to determine the latest version.

    Example of a meta entry:

      const metaArray = [ _meta_, _meta_, ... ]
      
      viz.

      const metaArray = [
        {
          "languageId": "python",
          "extensionPathInfo": {
            "fullPath": "/Users/andy/.vscode/extensions/ms-toolsai.jupyter-2024.9.1-darwin-arm64/snippets/python.json",
            "extensionId": "ms-toolsai.jupyter",
            "extensionVersion": "2024.9.1",
            "basename": "python.json"
          }
        },
        ....
      ]

    Algorithm
    ---------
    
    Generate a temporary grouping object:
      group = {
        languageId: {
          extensionId: {
            snippet_basename: [meta, meta] <- duplicates!
          },
        }
      }

    For each languageId in snippetTree
      For each fullPathDict
        group.languageId.extensionId.snippet_basename.push(fullPathDict._meta_)

    So now we have our grouping object e.g.:
      {
        'python': {
          'ms-python.python': {
            'python.json': [ meta1 , meta2 ]  <- if more than one meta then there are duplicates!
          }
          'python.extras': {  <- another python extension found
            'python.json': [ meta3 ]
          }
        },
        'dart': {
          'dart-code.dart-code': {  <- note the one plugin contains multiple basenames
            'dart.json': [ meta1  ],  <- first
            'flutter.json': [ meta2 ],  <- second, not counted as a duplicate cos its a different basename
          }
        }
      }

    For each languageId in group
      For each extensionId
        For each basename
          If there are multiple meta entries then we need to pick the latest, so
          Sort the meta entries by .extensionVersion and remove the topmost entry, which should be the latest vers

          // The remaining entries can then be killed off from the real snippetTree
          For each .fullPath in the kill list
            delete entry snippetTree.languageId.fullPath

  * 
  * @param {*} snippetTree 
  * @param {*} options {warn: boolean} [optional]
  */
function removeOutdatedExtensions(snippetTree, options) {
    let group = new Group();

    // Build the temporary grouping object. Assumes meta info is correct and present.
    for (const [languageId, fullPathSubTree] of Object.entries(snippetTree)) {
        for (const [fullPath, snippets] of Object.entries(fullPathSubTree)) {
            let meta = snippets["_meta_"]
            console.assert(meta)
            console.assert(meta.extensionPathInfo)
            console.assert(meta.languageId == languageId)
            console.assert(meta.extensionPathInfo.fullPath == fullPath)
            if (meta.kind == SnippetKind.EXTENSION)
                group.add(meta)
        }
    }

    for (const [_languageId, extensionIds] of Object.entries(group.group)) {
        for (const [_extensionId, snippetBaseNames] of Object.entries(extensionIds)) {
            for (const [_basename, metaInfoArray] of Object.entries(snippetBaseNames)) {
                if (metaInfoArray.length > 1) {

                    // need to pick the latest and delete the rest
                    sortMetaArray(metaInfoArray);

                    metaInfoArray.shift(); // pop the latest, best

                    metaInfoArray.forEach(function (metaInfo) { // delete the rest
                        delete snippetTree[metaInfo.languageId][metaInfo.extensionPathInfo.fullPath]
                        if (options && options.warn)
                            appLog(`Removed out of date snippets for extension ${metaInfo.extensionPathInfo.fullPath}`)
                    });
                }
            }
        }
    }
}

class Group {
    constructor() {
        this.group = {}
    }

    add(meta) {
        let languageId = meta.languageId
        let extensionId = meta.extensionPathInfo.extensionId
        let basename = meta.extensionPathInfo.basename

        // create path
        if (!this.group[languageId])
            this.group[languageId] = {};
        if (!this.group[languageId][extensionId])
            this.group[languageId][extensionId] = {};
        if (!this.group[languageId][extensionId][basename])
            this.group[languageId][extensionId][basename] = [];

        this.group[languageId][extensionId][basename].push(meta)
    }
}

function sortMetaArray(metaInfoArray) {
  metaInfoArray.sort(function (a, b) {
    const versionA = a.extensionPathInfo.extensionVersion.split('.').map(Number);
    const versionB = b.extensionPathInfo.extensionVersion.split('.').map(Number);

    for (let i = 0; i < versionA.length; i++) {
      if (versionA[i] !== versionB[i]) {
        return versionB[i] - versionA[i];
      }
    }
    return 0;
  });
}

exports.removeOutdatedExtensions = removeOutdatedExtensions;
exports.sortMetaArray = sortMetaArray;

