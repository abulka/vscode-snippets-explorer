function expandIntoMultipleLanguageIds(languageId) {
    // Special cases - should move to a config file?
    const languageMap = {
        'vue': ['vue', 'vue-html', 'vue-scss', 'vue-postcss', 'vue-pug', 'vue-stylus', 'vue-tsx', 'html', 'typescript', 'javascript'],
        'typescript': ['typescript', 'javascript'],
        'typescriptreact': ['typescript', 'javascript', 'tsx'], // .tsx files
        'javascriptreact': ['javascript', 'tsx'], // .jsx files
        'dart': ['dart', 'flutter'],
        'ipynb': ['ipynb', 'python'],
    };

    return languageMap[languageId] || [languageId];
}
module.exports = expandIntoMultipleLanguageIds;