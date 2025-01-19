const { createMetaEntry } = require("../extensionPathInfo")

/** 
 * Recalculate the meta entries in the snippetTree.
 * 
 * @param {Object} snippetTree - The snippet tree to recalculate the meta entries for
 * @returns {undefined}
 * 
 * A meta entry is an object that contains information about the snippet, such as the languageId, kind, and fullPath.
 * Especially useful for extension snippets, as it allows us to store the extensionId and extensionVersion which is
 * used to remove outdated, duplicate extensions.
 * 
 *     snippetsDict["_meta_"] = {
        languageId: languageId,
        kind: kind,
        kindNiceName: snippetKindToNiceName(kind),
        extensionPathInfo: 
            fullPath = fullPath;
            extensionId;
            extensionVersion;
            basename;
    }
 *
 */
function recalculateMetas(snippetTree) {
    for (const [languageId, fullPathsDict] of Object.entries(snippetTree)) {
        for (const [fullPath, snippetsDict] of Object.entries(fullPathsDict)) {
            let kind = snippetsDict._meta_.kind
            createMetaEntry(snippetsDict, languageId, kind, fullPath)
        }
    }
}

exports.recalculateMetas = recalculateMetas