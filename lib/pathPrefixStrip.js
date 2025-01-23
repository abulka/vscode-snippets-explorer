const path = require('path');
const os = require('os');

function pathPrefixStrip(filePath) {
    const homeDir = os.homedir();
    const userSnippetsDir = {
        'Darwin': path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'snippets'),
        'Linux': path.join(homeDir, '.config', 'Code', 'User', 'snippets'),
        'Windows_NT': process.env.APPDATA ? path.join(process.env.APPDATA, 'Code', 'User', 'snippets') : undefined
    }[os.type()];

    const extensionsDir = path.join(homeDir, '.vscode', 'extensions');
    let result;

    if (userSnippetsDir && filePath.startsWith(userSnippetsDir)) {
        result = path.join('User', 'snippets', path.relative(userSnippetsDir, filePath));
    } else if (filePath.startsWith(extensionsDir)) {
        result = path.relative(path.join(homeDir, '.vscode'), filePath).replace(/^extensions[\/\\]/, '');
    } else {
        result = filePath;
    }

    return result;
}

module.exports = {
    pathPrefixStrip,
}
