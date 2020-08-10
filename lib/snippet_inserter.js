const vscode = require('vscode');

function snippet_inserter(body) {
	vscode.window.showTextDocument(vscode.window.activeTextEditor.document) // focus on editor
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const snippetString = new vscode.SnippetString(body);
		editor.insertSnippet(snippetString)
	}
}

module.exports = {
	snippet_inserter,
}
