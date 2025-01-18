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

    if (userSnippetsDir && filePath.startsWith(userSnippetsDir)) {
        return path.join('User', 'snippets', path.relative(userSnippetsDir, filePath));
    } else if (filePath.startsWith(extensionsDir)) {
        return path.relative(path.join(homeDir, '.vscode'), filePath);
    } else {
        return filePath;
    }
}

module.exports = {
    pathPrefixStrip,
}
