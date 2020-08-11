const vscode = require('vscode');
const fs = require("fs");
const path = require("path");
const os = require('os');
const { scanFiles } = require('./snippet_scanner')
const { SnippetKind, snippetKindToNiceName } = require('./snippet_kind')
const { removeOutdatedExtensions } = require("./snippet_repair/removeOutdatedExtensions")
const { appLog: appLog } = require("./app_logger")

let debug = true



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
function enumerateSnippets(snippetTree, languageId) {

	appLog('enumerateSnippets');

	if (snippetTree[languageId] == undefined)
		snippetTree[languageId] = {}

	// Project snippets
	vscode.workspace.workspaceFolders.forEach(workspaceFolder => {
		let vscodeDir = path.join(workspaceFolder.uri.fsPath, '.vscode')
		listSnippets(vscodeDir, '\.code-snippets$', SnippetKind.PROJECT, languageId, snippetTree)
	});

	// User Snippets
	listSnippets(getUserSnippetsDir(), '\.json$', SnippetKind.USER, languageId, snippetTree)

	// Installed Extension Snippets (each extension may have its own)
	getThirdPartyExtensionDirs().forEach(dir => {
		let snippetsDir = path.join(dir, 'snippets')
		listSnippets(snippetsDir, '\.json$', SnippetKind.EXTENSION, languageId, snippetTree)
	});

	// Built in Extension Snippets (bundled with each release of vscode and cannot be changed)
	getBundledAppDefaultExtensionDirs().forEach(dir => {
		let snippetsDir = path.join(dir, 'snippets')
		listSnippets(snippetsDir, '\.code-snippets$', SnippetKind.BUILTIN, languageId, snippetTree)
	});

	removeOutdatedExtensions(snippetTree, { warn: true });

	if (debug) {
		// console.log('final snippetTree is', JSON.stringify(snippetTree, null, 2))  // dump the whole object!
		// console.log('final snippetTree keys are', JSON.stringify(Object.keys(snippetTree))) // dump the root keys keys
		for (const [languageId, fullPathSubTree] of Object.entries(snippetTree)) {
			for (const fullPath of Object.keys(fullPathSubTree)) {
				appLog(`Found snippet file ${languageId} - ${fullPath}`)
			}
		}
	}

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
 */
function listSnippets(dir, extension, kind, languageId, snippetTree, debug) {
	console.assert(extension)
	console.assert(languageId)

	if (!debug) debug = false
	let extensionRe = new RegExp(extension);
	if (debug) console.log(`Scanning dir ${dir}`)
	if (fs.existsSync(dir)) {
		const snippetFiles = fs.readdirSync(dir)
			.filter(el => extensionRe.test(el));  // was .filter(el => /\.code-snippets$/.test(el));
		if (debug) appLog(`${snippetKindToNiceName(kind)} snippet files detected in ${dir} are:\n\t${snippetFiles}`)

		scanFiles(dir, snippetFiles, kind, languageId, snippetTree) // will add entries to the snippetTree
		if (debug) appLog(`snippetTree grew to ${JSON.stringify(snippetTree)}`)
	}
	else { if (debug) appLog(`no such dir ${dir}`) }
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
function getThirdPartyExtensionDirs() {
	let extensionsPath;
	// let directorySeparator = '/';
	// let vscode_subdir = (vscode.env.appName.includes("Visual Studio Code - Insiders") ? 'Code - Insiders' : 'Code')
	let vscode_subdir = '.vscode'

	switch (os.type()) {
		case 'Darwin':
			extensionsPath = process.env.HOME + `/${vscode_subdir}/extensions/`;
			break;
		case 'Linux':
			extensionsPath = process.env.HOME + `/${vscode_subdir}/extensions/`; // untested
			break;
		case 'Windows_NT':
			extensionsPath = process.env.HOMEPATH + `\\${vscode_subdir}\\extensions\\`;
			// directorySeparator = "\\";
			break;
		default:
			extensionsPath = process.env.HOME + `/${vscode_subdir}/extensions/`; // untested
			break;
	}

	// Now we have to loop through each extension and look at its snippets
	// potentially do this asynchronously
	let extensionsDirs
	let result
	if (fs.existsSync(extensionsPath)) {
		extensionsDirs = fs.readdirSync(extensionsPath)
		// put back the prefix to get the full path
		result = extensionsDirs.map((dir) => path.join(extensionsPath, dir))
	}
	else result = []
	return result
}

function getBundledAppDefaultExtensionDirs() {
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
	if (fs.existsSync(extensionsPath)) {
		extensionsDirs = fs.readdirSync(extensionsPath)
		// put back the prefix to get the full path
		result = extensionsDirs.map((dir) => path.join(extensionsPath, dir))
	}
	else result = []

	return result
}


module.exports = {
	enumerateSnippets,
}
