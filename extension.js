// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { snippet_inserter } = require('./lib/snippet_inserter');
const { TreeDataProvider: SnippetTreeDataProvider } = require('./lib/snippet_tree')
const { appLog: appLog } = require("./lib/app_logger")

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    appLog('Congratulations, your extension "snippetsexplorer" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable

    disposable = vscode.commands.registerCommand('extension.snippet_inserter', function (snippetBody) {
        if (!snippetBody)
            vscode.window.showInformationMessage(`Insert Snippet from Treeview is triggered by clicking on a snippet in the treeview - shouldn't be manually invoked`);
        snippet_inserter(snippetBody)
    });
    context.subscriptions.push(disposable);

    // tree view stuff (tree data providers are all NodeDependenciesProvider types)

    let snippetTreeDataProvider = new SnippetTreeDataProvider()
    await snippetTreeDataProvider.init()
    let treeview = vscode.window.createTreeView('snippetsExplorerView', {
        showCollapseAll: true,
        treeDataProvider: snippetTreeDataProvider
    });
    snippetTreeDataProvider.setTreeView(treeview) // a bit hacky - is there a better way?

    // snippets tree 'refresh' button
    vscode.commands.registerCommand('snippetsExplorer.refreshEntry', () =>
        snippetTreeDataProvider.refresh()
    );

}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }

/*
Possible future command, to enable add this:

	"commands": [
		{
			"command": "extension.enumerateSnippets",
			"title": "Snippets Explorer: Enumerate All Snippets"
		},

And uncomment this code:

	const { enumerateSnippets } = require('./lib/snippet_enumerator');

	function activate(context) {
		...
		disposable = vscode.commands.registerCommand('extension.enumerateSnippets', function () {
			let tmpSnippetTree = {} // discarded after we fill it in
			let snippetTree = enumerateSnippets(tmpSnippetTree, 'javascript')
			vscode.window.showInformationMessage(`Snippets found for languages: ${Object.keys(snippetTree)}`);
				// perhaps do something else useful - insert all filenames or snippet names into active doc?
		});
		context.subscriptions.push(disposable);
*/

module.exports = {
    activate,
    deactivate
}
