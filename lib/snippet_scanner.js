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
 * The algorithm to make a entry in the tree is when (note 'languageId' is same as 'scope')
 * 	- If there is a exact, perfect filename match of scope (viz. languageId) param
 *    with languageId.json or languageId.code-snippets
 *  - If "languageId-" appears somewhere in the extension path
 *  - If its a project dir then accept any .code-snippets - a bit liberal, yes, but we will later
 * 	  look inside and extract any snippets with entries "scope: " matching languageId
 *
 * Each successful test of a file will result in a new, unique node entry in the snippetTree
 *
 * @param {string path} dir
 * @param {list of string filenames} snippetFiles
 * @param {SnippetKind} kind one of user, project, externsion, builtin
 * @param {string} languageId aka. languageId, the language id e.g. 'javascript' TODO rename this param
 * @param {dictionary} snippetTree master output dictionary object
 */
async function scanFiles(dir, snippetFiles, kind, languageId, snippetTree) {
  // console.log(`DIR ${dir}`) // filled with ${snippetFiles}`)
  console.assert(kind);
  console.assert(languageId);

  var promises = [];
  for (const f of snippetFiles) {
    console.assert(!languageId.includes(",")); // multiple scopes currently not supported e.g. "javascript,typescript"

    var filename = path.basename(f);
    let perfectMatch =
      filename == `${languageId}.json` || filename == `${languageId}.code-snippets`;

    // e.g. 'flutter-' in extensions/nash.awesome-flutter-snippets-2.0.4/snippets/snippets.json
    let extensionPathMatch = SnippetKind.EXTENSION && dir.includes(`${languageId}-`);

    if (
      (languageId && perfectMatch) ||
      extensionPathMatch ||
      (kind == SnippetKind.PROJECT && path.extname(f) == ".code-snippets")
    ) {
      let fullPath = path.join(dir, f);
      promises.push(scanFile(fullPath, kind, languageId)) // 'languageId' only used if its a .code-snippets and SnippetKind is PROJECT
    }
  }
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
};
