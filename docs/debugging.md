# Debugging

To debug, set `debugSnippetFileNamesFound` flag in `lib/snippet_enumerator.js`.

> `enumerateSnippets` calls `listSnippets` many times, scanning various locations on your pc for snippet json files. The function listSnippets takes a debug parameter, which is mainly controlled by the `debugSnippetFileNamesFound` flag in `lib/snippet_enumerator.js`

## Log file location

Calls to `appLog` will be logged to the console and to the log file `/Users/andy/Library/Logs/vscode-snippets-explorer/vscode-snippets-explorer-debug.log` which can be viewed in the Mac Console app.

If debugging under linux wsl the log file will be in `/home/YOURNAME/.config/vscode-snippets-explorer/vscode-snippets-explorer-debug.log`

## Example Log

Example on Mac

![Debugging](/docs/images/debugging.png)

