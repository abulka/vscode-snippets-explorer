const { createMetaEntry } = require("../extensionPathInfo")

/** Our test data has simple meta with kind only - fix */
function expandFixSimpleMetas(snippetTree) {
    for (const [languageId, fullPathsDict] of Object.entries(snippetTree)) {
        for (const [fullPath, snippetsDict] of Object.entries(fullPathsDict)) {
            let kind = snippetsDict._meta_.kind
            createMetaEntry(snippetsDict, languageId, kind, fullPath)
        }
    }
}

exports.expandFixSimpleMetas = expandFixSimpleMetas