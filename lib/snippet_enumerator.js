const vscode = require('vscode');
// const fs = require("fs");
const fsp = require("fs").promises;  // modern API - no callbacks, return promises
const path = require("path");
const os = require('os');
const { scanFiles, scanGlobalFiles } = require('./snippet_scanner')
const { SnippetKind, snippetKindToNiceName } = require('./snippet_kind')
const { removeOutdatedExtensions } = require("./snippet_repair/removeOutdatedExtensions")
const { appLog: appLog } = require("./app_logger")

let debugSnippetFileNamesFound = false



/**
 * Loop through the actual dirs and files to find all snippet files.
 * 
 * There does not seem to be any public API to enumerate all such snippet files in a programmatic way.
 * https://stackoverflow.com/questions/58777976/get-visual-studio-code-snippets-scope-programmatically-using-api
 * 
 * @param {dict} snippetTree tree to populate
 * @param {string} languageId language to search for snippets for
 * 
 * Returns: snippetTree, (not necessary because a snippetTree is passed in and modified in place, but handy)
 * 
 **/
async function enumerateSnippets(snippetTree, languageId) {

    // Ignore irrelevant language ids triggered by visiting the debug console and search window
    const ignoreLanguageIds = ["search-result","source-ag-output"]
    if (ignoreLanguageIds.includes(languageId))
        return snippetTree

    appLog(`enumerating snippets for ${languageId}...`);

    if (snippetTree[languageId] == undefined)
        snippetTree[languageId] = {}

    let masterPromises = []  // Run all these 4 stages in parallel

    // Project snippets
    for (const workspaceFolder of vscode.workspace.workspaceFolders) {
        let vscodeDir = path.join(workspaceFolder.uri.fsPath, '.vscode')
        masterPromises.push(listSnippets(vscodeDir, '\.code-snippets$', SnippetKind.PROJECT, languageId, snippetTree))
    }

    // User Snippets
    masterPromises.push(listSnippets(getUserSnippetsDir(), '\.json$', SnippetKind.USER, languageId, snippetTree))
    
    // Global User Snippets (found in ~/Library/Application Support/Code/User/snippets/ which is the same location as language specific snippets with .json extensions except that global user snippets have arbitrary user defined file names and the .code-snippets file extension).
    masterPromises.push(listSnippets(getUserSnippetsDir(), '\.code-snippets$', SnippetKind.GLOBAL_USER, languageId, snippetTree, debugSnippetFileNamesFound, true));

    // Installed Extension Snippets (each extension may have its own)
    let promises = [];
    for (const dir of await getThirdPartyExtensionDirs()) {
        let snippetsDir = path.join(dir, 'snippets')
        promises.push(listSnippets(snippetsDir, '\.json$', SnippetKind.EXTENSION, languageId, snippetTree, debugSnippetFileNamesFound))
    }
    masterPromises.push(Promise.all(promises))

    // Built in Extension Snippets (bundled with each release of vscode and cannot be changed)
    for (const dir of await getBundledAppDefaultExtensionDirs()) {
        let snippetsDir = path.join(dir, 'snippets')
        masterPromises.push(listSnippets(snippetsDir, '\.code-snippets$', SnippetKind.BUILTIN, languageId, snippetTree))
    }

    // Portable Mode Snippets
    const vscodeInstallPath = vscode.env.appRoot;
    // Look for a 'data' subdirectory underneath vscode install location, 
    // just in case Visual Studio Code is used in portable mode - see https://github.com/abulka/vscode-snippets-explorer/issues/9 
    // Then derive snippets dir e.g. 'c:\Users\Andy\AppData\Local\Programs\Microsoft VS Code\data\user-data\User\snippets\'
    // Tested on Windows and Mac, not on Linux.
    // e.g. Mac: '/Applications/Visual Studio Code.app/Contents/Resources/app'
    // e.g. Windows: 'c:\Users\Andy\AppData\Local\Programs\Microsoft VS Code\resources\app'
    let upDir = process.platform == 'darwin' ? '../../../..' : '../..'  // on mac have to go a bit higher to get out of app bundle
    let standaloneSnippetsDir = path.join(vscodeInstallPath, upDir, 'data/user-data/User/snippets/')
    // console.log('standaloneSnippetsDir', standaloneSnippetsDir)
    masterPromises.push(listSnippets(standaloneSnippetsDir, '\.json$', SnippetKind.USER, languageId, snippetTree))

    // Wait for all snippets to be found...
    await Promise.all(masterPromises)
    removeOutdatedExtensions(snippetTree, { warn: true });

    if (debugSnippetFileNamesFound) {
        // console.log('final snippetTree is', JSON.stringify(snippetTree, null, 2))  // dump the whole object!
        for (const [languageId, fullPathSubTree] of Object.entries(snippetTree)) {
            for (const fullPath of Object.keys(fullPathSubTree)) {
                // appLog(`  Found snippet file for languageId '${languageId}' - ${fullPath}`)
                appLog(`  Found (${languageId}) - ${fullPath}`)
            }
        }
    }
    appLog(`final snippetTree keys are ${JSON.stringify(Object.keys(snippetTree))}, enumerating snippets for '${languageId}' complete!`) // dump the root keys keys

    return snippetTree
}

/**
 * Lists all snippet files in directory matching extension.
 * @param {string} dir directory to scan for file
 * @param {string regexp} extension extension to look for
 * @param {string regexp} kind the kind of extension, one of SnippetKind (PROJECT, USER, EXTENSION, BUILTIN)
 * @param {string} languageId e.g. 'javascript' TODO comma separated strings (actually probably not necessary)
 * @param {dict} snippetTree output object
 * @param {string} debug display console debugging [optional]
 * @param {boolean} isGlobal is this a global snippet file? [optional]
 */
async function listSnippets(dir, extension, kind, languageId, snippetTree, debug, isGlobal = false) {
    console.assert(extension)
    console.assert(languageId)

    if (!debug) debug = false
    let extensionRe = new RegExp(extension);
    let snippetFiles

    if (debug) console.log(`Scanning dir ${dir}`)
    try {
        snippetFiles = await fsp.readdir(dir)
    }
    catch (e) {
        // if (debug) console.log(`no such dir ${dir} ${e}`)
        return
    }
    snippetFiles = snippetFiles.filter(el => extensionRe.test(el))
    if (debug)
        appLog(`${dir} (${snippetKindToNiceName(kind)}, ${extension}) contains:\n\t${snippetFiles}`)

    if (isGlobal) {
        await scanGlobalFiles(dir, snippetFiles, kind, languageId, snippetTree) // will add entries to the snippetTree
    } else {
        await scanFiles(dir, snippetFiles, kind, languageId, snippetTree) // will add entries to the snippetTree
    }
    if (debug) appLog(`snippetTree grew to ${JSON.stringify(snippetTree)}`)
}

function getUserSnippetsDir() {
    let settingsPath;
    let directorySeparator = '/';
    let vscode_subdir = (vscode.env.appName.includes("Visual Studio Code - Insiders") ? 'Code - Insiders' : 'Code')

    switch (os.type()) {
        case 'Darwin':
            settingsPath = process.env.HOME + `/Library/Application Support/${vscode_subdir}/User/`;
            break;
        case 'Linux':
            settingsPath = process.env.HOME + `/.config/${vscode_subdir}/User/`;
            break;
        case 'Windows_NT':
            settingsPath = process.env.APPDATA + `\\${vscode_subdir}\\User\\`;
            directorySeparator = "\\";
            break;
        default:
            settingsPath = process.env.HOME + `/.config/${vscode_subdir}/User/`;
            break;
    }
    let result = `${settingsPath}snippets${directorySeparator}`
    return result
}

/**
 * List extension directories, there may be a snippets dir inside some of them
 * Return: list of extension dirs (not snippets, yet)
 */
async function getThirdPartyExtensionDirs() {
    let extensionsPath;
    let vscode_subdir = '.vscode'

    switch (os.type()) {
        case 'Darwin':
            extensionsPath = process.env.HOME + `/${vscode_subdir}/extensions/`;
            break;
        case 'Linux':
            extensionsPath = process.env.HOME + `/${vscode_subdir}/extensions/`;
            break;
        case 'Windows_NT':
            extensionsPath = process.env.HOMEPATH + `\\${vscode_subdir}\\extensions\\`;
            break;
        default:
            extensionsPath = process.env.HOME + `/${vscode_subdir}/extensions/`;
            break;
    }

    // Now we have to loop through each extension and look at its snippets
    // potentially do this asynchronously
    let extensionsDirs
    let result

    try {
        extensionsDirs = await fsp.readdir(extensionsPath)
    } catch (error) {
        result = []
        return result
    }
    // put back the prefix to get the full path
    result = extensionsDirs.map((dir) => path.join(extensionsPath, dir))
    return result
}

async function getBundledAppDefaultExtensionDirs() {
    let extensionsPath;

    switch (os.type()) {
        case 'Darwin':
            extensionsPath = `/Applications/Visual\ Studio\ Code.app/Contents/Resources/app/extensions/`;
            break;
        case 'Linux':
            // Assuming you install vscode as a snap, which ends up in /snap then extension seem to get placed in
            // '/snap/code/current/usr/share/code/resources/app/extensions/'
            // extensionsPath = '/snap/code/current/usr/share/code/resources/app/extensions/'

            // Another approach is to look at process.env._ just remove the trailing 'code' basename
            // "_": "/snap/code/39/usr/share/code/code",
            const removeBasename = dirname => path.parse(dirname).dir
            const vscodePath = removeBasename(process.env._)
            extensionsPath = path.join(vscodePath, '/resources/app/extensions')
            break;
        case 'Windows_NT':
            // e.g. "C:\Users\Andy\AppData\Local\Programs\Microsoft VS Code\resources\app\extensions\"
            extensionsPath = path.join(process.env.VSCODE_CWD, 'resources', 'app', 'extensions')
            break;
        // default:
        //     extensionsPath = process.env.HOME + `/${vscode_subdir}/extensions/`; // ?
        //     break;
    }

    // Now we have to loop through each extension and look at its snippets
    // potentially do this asynchronously
    let extensionsDirs
    let result

    try {
        extensionsDirs = await fsp.readdir(extensionsPath)
    } catch (error) {
        result = []
        return result
    }
    // put back the prefix to get the full path
    result = extensionsDirs.map((dir) => path.join(extensionsPath, dir))
    return result
}


module.exports = {
    enumerateSnippets,
}
