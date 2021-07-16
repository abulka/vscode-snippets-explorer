# Doco on snippet locations

There are four snippet locations
- Project Snippets
- User Snippets
- Extension Snippets
- Built in Extension Snippets

# Finding all snippet JSON files

There does not seem to be any public API to enumerate all such snippet files in a programmatic way.
https://stackoverflow.com/questions/58777976/get-visual-studio-code-snippets-scope-programmatically-using-api

You have to loop through the dirs and find them all.

## Project Snippets

In your project directory in `.vscode/*.code-snippets`

## User Snippets

Depending on your platform, the user snippets directory is located here:

- Windows %APPDATA%\Code\User\snippets\
- Mac $HOME/Library/Application Support/Code/User/snippets/
- Linux $HOME/.config/Code/User/snippets/

e.g.
`~/Library/Application\ Support/Code/User/snippets/` contains e.g. `dart.json
html.json
javascript.json
plaintext.json  
python.json`

Here is some code to get to the appropriate directory:

```javascript
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
```

## Extension Snippets

Extensions are installed in a per user extensions folder. Depending on your platform, the location is in the following folder:

- Windows %USERPROFILE%\.vscode\extensions\
- macOS ~/.vscode/extensions/
- Linux ~/.vscode/extensions/

e.g.
`/Users/Andy/.vscode/extensions/ms-python.python-2020.7.96456/snippets/python.json`

> Note: The Mac/Linux locations can also be referred to via `$HOME` instead of `~` viz. 
`$HOME/.vscode/extensions/`


## Built in Extension Snippets

These are bundled with each release of vscode and cannot be changed. They contain e.g. the Javascript snippets which are part of the bundled Javascript extension.  They typically are delivered with and live next to the Vscode exectuable.

See also https://stackoverflow.com/questions/40110541/how-to-edit-existing-vs-code-snippets

Note: Python snippets have been removed from the MS Python extension.

### On Windows 
`C:\Program Files (x86)\Microsoft VS Code\resources\app\extensions\javascript\snippets\javascript.json`

### On Mac 

its `/Applications/Visual\ Studio\ Code.app/Contents/Resources/app/extensions/javascript/snippets/javascript.code-snippets` - you'll have to navigate to the `Visual Studio Code` app and right click to Show Package Contents.

### On Linux

Assuming you install vscode as a snap, which ends up in `/snap` then extension seem to get placed in
`/snap/code/current/usr/share/code/resources/app/extensions/` - however a
more resilient approach is to look at node's `process.env._` entry 
which is something like
```
"_": "/snap/code/39/usr/share/code/code",
```
and remove the trailing `'code'` (which is the vscode executable basename)
then add `'/resources/app/extensions'` e.g. here is the nodejs code I use:

```javascript
const removeBasename = dirname => path.parse(dirname).dir // util func
const vscodePath = removeBasename(process.env._)
extensionsPath = path.join(vscodePath, '/resources/app/extensions')
```

## Portable Mode Snippets

A final location to look for snippets...

Look for a 'data' subdirectory underneath vscode install location, 
just in case Visual Studio Code is used in portable mode - see https://github.com/abulka/vscode-snippets-explorer/issues/9 

Then derive snippets dir e.g. `c:\Users\Andy\AppData\Local\Programs\Microsoft VS Code\data\user-data\User\snippets\`

Tested on Windows and Mac, not on Linux.

    e.g. Mac: '/Applications/Visual Studio Code.app/Contents/Resources/app'
    e.g. Windows: 'c:\Users\Andy\AppData\Local\Programs\Microsoft VS Code\resources\app'

# Scanning JSON

`const jsonc = require('jsonc-parser');` is a bog standard parser which cannot handle trailing
commas, which sometimes creep into snippets, which are JSON.

`const JSON5 = require('json5')` is a more relaxed parser which allows trailing commas and also 
comments in the JSON. Yey! 🎉

## Research on parsing dodgy JSON

See my `research/trailing_json_parsing/scan.js` 

See also my https://github.com/microsoft/vscode/issues/104141 issue which is about 

> The bundled Javascript snippets e.g.
/Applications/Visual Studio Code.app/Contents/Resources/app/extensions/javascript/snippets/javascript.code-snippets
have a couple of trailing commas which breaks official JSON parsing. Seems to have been introduced recently.

Pending a fix, I am switching to JSON5 parser for resiliency.  Though, it doesn't keep 
parsing when it gets an error, it just throws an exception. Oh well, I can live with that.
