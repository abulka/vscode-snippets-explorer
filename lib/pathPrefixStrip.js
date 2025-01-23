const path = require('path');
const os = require('os');

function pathPrefixStrip(filePath) {
    const homeDir = os.homedir();
    
    // VSCode installation paths
    const vscodeAppPaths = {
        'Darwin': [
            '/Applications/Visual Studio Code.app/Contents/Resources/app',
            '/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app',
            path.join(homeDir, 'Applications', 'Visual Studio Code.app/Contents/Resources/app'),
            path.join(homeDir, 'Applications', 'Visual Studio Code - Insiders.app/Contents/Resources/app')
        ],
        'Linux': [
            '/usr/share/code/resources/app',
            '/usr/share/code-insiders/resources/app'
        ],
        'Windows_NT': [
            'C:\\Program Files\\Microsoft VS Code\\resources\\app',
            'C:\\Program Files\\Microsoft VS Code Insiders\\resources\\app'
        ]
    }[os.type()] || [];

    // User snippets directories
    const userSnippetsDir = {
        'Darwin': path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'snippets'),
        'Darwin-Insiders': path.join(homeDir, 'Library', 'Application Support', 'Code - Insiders', 'User', 'snippets'),
        'Linux': path.join(homeDir, '.config', 'Code', 'User', 'snippets'),
        'Linux-Insiders': path.join(homeDir, '.config', 'Code - Insiders', 'User', 'snippets'),
        'Windows_NT': process.env.APPDATA ? path.join(process.env.APPDATA, 'Code', 'User', 'snippets') : undefined,
        'Windows_NT-Insiders': process.env.APPDATA ? path.join(process.env.APPDATA, 'Code - Insiders', 'User', 'snippets') : undefined
    };

    const extensionsDir = path.join(homeDir, '.vscode', 'extensions');
    const insidersExtensionsDir = path.join(homeDir, '.vscode-insiders', 'extensions');

    // Strip VSCode app installation prefix
    for (const appPath of vscodeAppPaths) {
        if (filePath.startsWith(appPath)) {
            filePath = path.relative(appPath, filePath);
            break;
        }
    }

    // Handle user snippets
    const userSnippetsDirs = Object.values(userSnippetsDir).filter(dir => dir);
    for (const snippetsPath of userSnippetsDirs) {
        if (filePath.startsWith(snippetsPath)) {
            return path.join('User', 'snippets', path.relative(snippetsPath, filePath));
        }
    }

    // Handle extensions
    if (filePath.startsWith(extensionsDir)) {
        return path.relative(path.join(homeDir, '.vscode'), filePath).replace(/^extensions[\/\\]/, '');
    }

    if (filePath.startsWith(insidersExtensionsDir)) {
        return path.relative(path.join(homeDir, '.vscode-insiders'), filePath).replace(/^extensions[\/\\]/, '');
    }

    // If no matching path is found, return the original path
    return filePath;
}

module.exports = {
    pathPrefixStrip,
}
