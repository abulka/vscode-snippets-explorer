/**
 * Removes snippet body dicts (containing snippet entries and one meta), leaving
 * only language and fullpath entries (used by mocha tests only)
 *
 * @param {dict} snippetTree - modified in place
 */
function removeSnippetBodies(snippetTree) {
    for (const [languageId, fullPathSubTree] of Object.entries(snippetTree)) {
        // eslint-disable-next-line no-unused-vars
        for (const [fullPath, snippets] of Object.entries(fullPathSubTree)) {
            snippetTree[languageId][fullPath] = {} // zap snippets object containing snippet entries and one meta 
        }
    }
}

exports.removeSnippetBodies = removeSnippetBodies
