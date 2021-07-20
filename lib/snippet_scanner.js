const vscode = require("vscode");
// const fs = require("fs");
const fsp = require("fs").promises;  // modern API - no callbacks, return promises
const path = require("path");
const jsonc = require("jsonc-parser");
const JSON5 = require("json5");
// const { callbackify } = require("util");
const { repairWeirdNestedSnippets } = require("./snippet_repair/repairWeirdNestedSnippets")
const { SnippetKind } = require("./snippet_kind")
const { createMetaEntry } = require("./extensionPathInfo")
const { isEmpty } = require("./util");

let JSON5_PARSER = true;
let debug = false

/**
 * Scan a `directory` of `snippetFiles` for filenames matching `languageId` add to the
 * `snippetTree` data structure under the node label `kind` + `fullpath` of found snippet file.
 *
 * Resulting Sub-Structure lookes like:
 *    languageId
 *      kind + fullpath e.g. "EXTENSION /Users/Andy/.vscode/extensions/nash.awesome-flutter-snippets-2.0.4/snippets/snippets.json"
 *        snippets
 *      kind + fullpath e.g. "USER /Users/Andy/Library/Application Support/Code/User/snippets/javascript.json"
 *        snippets
 *
 * Each successful test of a file will result in a new, unique node entry in the snippetTree data structure, which 
 * will then later be visualised into a UI tree.
 *
 * @param {string path} dir
 * @param {list of string filenames} snippetFiles
 * @param {SnippetKind} kind one of user, project, extension, builtin
 * @param {string} languageId aka. languageId, the language id e.g. 'javascript' or 'dart'
 * @param {dictionary} snippetTree master output dictionary object
 */
async function scanFiles(dir, snippetFiles, kind, languageId, snippetTree) {
    console.assert(kind);
    console.assert(languageId);

    var promises = gatherScanPromises(snippetFiles, languageId, dir, kind);
    // now wait for them all, results will be an array of `scanFileResult` objects
    await Promise.all(promises).then(function (scanFileResult) {  // await to wait, .then() to access the results list
        scanFileResult.forEach((scanFileResult) => {
            let snippetsDict = scanFileResult.snippets
            if (snippetsDict && !isEmpty(snippetsDict)) {
                let { snippetFile: fullPath, kind, languageId } = scanFileResult
                createMetaEntry(snippetsDict, languageId, kind, fullPath)
                snippetTree[languageId][fullPath] = snippetsDict;
            }
        })
    })

}

function gatherScanPromises(snippetFiles, languageId, dir, kind) {
    var promises = [];
    console.assert(!languageId.includes(",")); // multiple scopes currently not supported e.g. "javascript,typescript"
    for (const f of snippetFiles) {

        let { perfectMatch, extensionPathMatch, projectDirMatch } = isSnippetFileRelevantToLanguageId(f, languageId, dir, kind);

        if (perfectMatch || extensionPathMatch || projectDirMatch) {
            let fullPath = path.join(dir, f);
            promises.push(scanFile(fullPath, kind, languageId)); // 'languageId' only used if its a .code-snippets and SnippetKind is PROJECT
        }
    }
    return promises;
}


/**
 * Figure out whether the snippet file 'f' is relevant to the languageId
 * If any of the fields in the return object are true, then the file is relevant
 * 
 * There is a bit of complicated logic here.
 * The algorithm to make a entry in the tree is when (note 'languageId' is same as 'scope')
 * 
 * 	- A: If there is a exact, perfect filename match of scope (viz. languageId) param
 *       with languageId.json or languageId.code-snippets
 * 
 *  - B: If "languageId-" appears somewhere in the extension path
 *          e.g. 'flutter-' in extensions/nash.awesome-flutter-snippets-2.0.4/snippets/snippets.json
 *       Though, limit this rule to files that still match the languageId 
 *          e.g. 'dart.json' or are generically names e.g. 'snippets.json'
 * 
 *  - C: If its a project dir then accept any .code-snippets - a bit liberal, yes, but we will later
 * 	     look inside and extract any snippets with entries "scope: " matching languageId
 * 
 * @param {string} filename - filename e.g. 'dart.json' or 'flutter.json' or 'snippets.json'
 * @param {string} languageId e.g. 'dart'
 * @param {string} dir - directory of the file
 * @param {SnippetKind} kind - one of user, project, extension, builtin
 * @returns {{perfectMatch: boolean, extensionPathMatch: boolean, projectDirMatch: boolean} which is
 *           is an object with the properties perfectMatch, extensionPathMatch, projectDirMatch
 *           giving you specific granular details about the match. Any one property being true means the 
 *           snippet file is relevant and should be scanned for snippets, and added to the tree for languageId.
 */
function isSnippetFileRelevantToLanguageId(filename, languageId, dir, kind) {
    const fileBaseName = path.basename(filename);
    const fileBaseNameNoExt = path.basename(filename, path.extname(filename))
    let validLanguageIds = [languageId];
    if (languageId == 'dart')  // Special case - should move to a config file or inject or parameterise?
        validLanguageIds.push('flutter')
    const validLanguageFileNames = validLanguageIds.map(l => `${l}.json`)

    // Case A: exact filename match of languageId, taking into account special case synonym of 'dart'/'flutter'
    let perfectMatch = validLanguageFileNames.includes(fileBaseName) || fileBaseName == `${languageId}.code-snippets`;

    // Case B: "languageId-" appears somewhere in the extension path
    const isGenericFileName = fileBaseName == 'snippets.json';// || filename == 'snippets.code-snippets';
    const allowPathMatching = SnippetKind.EXTENSION && (isGenericFileName || validLanguageIds.includes(fileBaseNameNoExt));
    const pathContainsLanguageIdFragment = validLanguageIds.some(languageId => dir.includes(`${languageId}-`));
    let extensionPathMatch = allowPathMatching && pathContainsLanguageIdFragment;

    // Case C: its a project dir
    let projectDirMatch = kind == SnippetKind.PROJECT && path.extname(filename) == ".code-snippets";

    return { perfectMatch, extensionPathMatch, projectDirMatch };
}

/**
 * Scan a JSON file and return snippet dictionary
 *
 * @param {string path} snippetFile e.g. /../../javascript.json
 * @param {SnippetKind} kind
 * @param {string} languageId e.g. 'javascript'
 *
 * Returns scanFileResult object or undefined if error. Note the scanFileResult object contains the
 *         all important .snippet dictionary, but also contains the original params, which our async code 
 *         happens to need access to again, when processing the async result list viz.
 *         scanFileResult is an object { snippetFile, kind, languageId, snippets }
 */
async function scanFile(snippetFile, kind, languageId) {
    let text;
    try {
        text = await fsp.readFile(snippetFile);
    } catch (error) {
        reportError(`error opening snippet file ${snippetFile} with error ${error}`);
        return;
    }

    // rest of the code
    let jsonText = text.toString();
    let snippets = [];

    if (JSON5_PARSER) {
        try {
            snippets = JSON5.parse(jsonText);
        } catch (error) {
            if (error instanceof SyntaxError) console.error("it is a syntax error");
            reportError(`error JSON5.parse error ${error}`);
            return;
        }
    } else {
        let parsingErrors = [];
        try {
            snippets = jsonc.parse(jsonText, parsingErrors);
        } catch (error) {
            reportError(`error jsonc.parse ${jsonText} with error ${error}`);
            return;
        }

        if (parsingErrors.length > 0) {
            let errors = [];
            parsingErrors.forEach((e) => {
                let errorText = `'${jsonc.printParseErrorCode(
                    e.error
                )}' error at offset ${e.offset}`;
                errors.push(errorText);
            });

            reportError(
                `Error${
                parsingErrors.length > 1 ? "s" : ""
                } on parsing snippet file ${snippetFile}: ${errors.join(", ")}`
            );
            return;
        }
    }

    snippets = repairWeirdNestedSnippets(snippets);

    if (
        kind == SnippetKind.PROJECT &&
        languageId &&
        path.extname(snippetFile) == ".code-snippets"
    )
        snippets = filterSnippets(snippets, languageId); // limit snippets to those in scope

    let keys = Object.keys(snippets);
    if (keys.length > 0) {
        if (debug) {
            let size = Math.min(5, keys.length);
            let msg = keys.slice(0, size).map((key) => `"${key}"`);
            console.log(`** found snippets: ${msg} etc. in ${snippetFile}`);
        }
        let scanFileResult = { snippetFile, kind, languageId }
        scanFileResult.snippets = snippets
        return scanFileResult
    }
    else
        return {};
}

function reportError(errorMessage) {
    console.log(errorMessage);
    vscode.window.showErrorMessage(errorMessage);
}

/**
 * Filters `snippets` leaving only those snippets that match scope. Assumes each snippet
 * has a scope entry e.g.
 *      "scope": "javascript,typescript",
 * which project snippets like
 *      `.vscode/proj_snips1.code-snippets`
 * have. Normal JSON snippets don't have the scope entry, cos the filename itself is the scope.
 * Though, some extensions use the .code-snippets extension hmmm.
 *
 * @param {object/hash} snippets dictionary of snippets
 * @param {string} scope e.g. "javascript" NOTE: "javascript,typescript" not supported yet
 *
 * Returns new dictionary object
 */
function filterSnippets(snippets, scope) {
    let newSnippets = {};
    for (const [key, value] of Object.entries(snippets)) {
        // console.log(`${key}: ${value}`);

        // Detect \.source\. keys with subnested snippets (only being done in dart extension)
        // defend against weird {.source.dart: {…}} snippet structure
        // see /Users/andy/.vscode/extensions/dart-code.dart-code-3.13.2/snippets/dart.json
        // if (key.includes('.source.')) {
        // 	console.warn(`detected bad snippet structure ${key}`)
        // 	// continue
        // }

        if (value.scope && value.scope.includes(scope)) newSnippets[key] = value;
    }
    return newSnippets;
}

module.exports = {
    scanFiles,
    isSnippetFileRelevantToLanguageId, // for testing
};
