/* eslint-disable */

function removeOutdatedExtensions(snippetTree, options) {
    let group = new Group();

    // Build the temporary grouping object
    for (const [languageId, fullPathSubTree] of Object.entries(snippetTree)) {
        for (const [fullPath, snippets] of Object.entries(fullPathSubTree)) {
            let meta = snippets["_meta_"]
            console.assert(meta)
            console.assert(meta.extensionPathInfo)
            console.assert(meta.languageId == languageId)
            console.assert(meta.extensionPathInfo.fullPath == fullPath)
            if (meta.kind == SnippetKind.EXTENSION) {
                group.add(meta)
                appLog(`Added ${meta.extensionPathInfo.fullPath} to group`);
            }
        }
    }
    appLog(`Grouping result: ${JSON.stringify(group.group, null, 2)}`);

    function extractVersion(fullPath) {
        const match = fullPath.match(/(\d+\.\d+\.\d+)/);
        appLog(`Extracted version: ${match ? match[0] : "0.0.0"}`);
        return match ? match[0] : "0.0.0";
    }

    function compareVersions(a, b) {
        const versionA = extractVersion(a.extensionPathInfo.fullPath).split('.').map(Number);
        const versionB = extractVersion(b.extensionPathInfo.fullPath).split('.').map(Number);

        for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
            const numA = versionA[i] || 0;
            const numB = versionB[i] || 0;
            if (numA > numB) return -1;
            if (numA < numB) return 1;
        }
        return 0;
    }

    for (const [languageId, extensionIds] of Object.entries(group.group)) {
        for (const [extensionId, snippetBaseNames] of Object.entries(extensionIds)) {
            for (const [basename, metaInfoArray] of Object.entries(snippetBaseNames)) {
                appLog(`Checking ${languageId} - ${extensionId} - ${basename} with ${metaInfoArray.length} entries`);
                if (metaInfoArray.length > 1) {
                    // need to pick the latest and delete the rest
                    appLog(`Processing ${languageId} - ${extensionId} - ${basename}`);
                    metaInfoArray.forEach(meta => {
                      appLog(`Version: ${extractVersion(meta.extensionPathInfo.fullPath)}, Path: ${meta.extensionPathInfo.fullPath}`);
                    });
                    metaInfoArray.sort(compareVersions);
                    metaInfoArray.shift(); // pop the latest, best
                    metaInfoArray.forEach(function (metaInfo) { // delete the rest
                        delete snippetTree[metaInfo.languageId][metaInfo.extensionPathInfo.fullPath];
                        if (options && options.warn)
                            appLog(`Removed out of date snippets for extension ${metaInfo.extensionPathInfo.fullPath}`);
                    });
                }
            }
        }
    }
}
