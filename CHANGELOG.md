# Change Log

All notable changes to the "snippet-explorer" extension will be documented in this file.

## 1.0.7

- Filter snippets feature, you can search for snippets by typing in the filter box at the top of the treeview
- Deeper scan for snippets offered by extensions via the package.json `contributes.snippets` field
- More descriptive snippet extension labels shown in the treeview letting you know where the snippet came from
- Removed duplicate snippet entries in treeview due to multiple old versions of same extension being found

## 1.0.6

- Support for Global Snippets (`.code-snippets` files in `~/Library/Application Support/Code/User/snippets/`)
- Remove previous language mode snippets when switching to a new language mode
- Better labels for snippet icons in treeview

## 1.0.5

- Made resilient against snippets with no descriptions
- Better detection of Flutter snippets in Dart language mode

## 1.0.4

- Portable Mode Snippets detection
  
## 1.0.3

- Readme doco on why Python extension snippets are not showing up.

## 1.0.2

- Fixed broken refresh button

## 1.0.1

- When switching files, the current selected language in the snippet tree remains unchanged if staying in the same language mode

## 1.0.0

- Async, faster reading of filesystem snippets

## 0.0.9

- Readme improvements incl. examples

## 0.0.8

- Bug fix focus jumping when in search view
- Better debugging log file locations, incl. documentation in readme

## 0.0.7

- Bug fixes re treeview focus
- Improved README documentation
- Ignore `.log` files (snippets are not searched for this language id)

## 0.0.5

- Added Linux support (tested on Ubuntu, vscode snap based installations)

## 0.0.4

- Added missing jsonc parser to packages
- Protect against various language mode events, and some events being undefined
- Added logging - see `C:\Users\YOURUSERNAME\AppData\Local\Programs\Microsoft VS Code\snippets-explorer-combined.log`

## 0.0.3

- Fixed Windows 10 snippet paths

## 0.0.2

- Changed name to "snippet-explorer"
- Added keywords to package.json to help improve marketplace discoverability

## 0.0.1

- Initial release