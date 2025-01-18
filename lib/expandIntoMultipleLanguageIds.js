function expandIntoMultipleLanguageIds(languageId) {
    // Special cases - should move to a config file?
    const languageMap = {
        'vue': ['vue', 'vue-html', 'vue-scss', 'vue-postcss', 'html'],
        'ts': ['ts', 'js'],
        'dart': ['dart', 'flutter']
    };

    return languageMap[languageId] || [languageId];
}
module.exports = expandIntoMultipleLanguageIds;