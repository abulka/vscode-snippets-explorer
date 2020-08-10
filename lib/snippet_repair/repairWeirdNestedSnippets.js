/**
 * Repair snippet object by grabbing inner snippet object and moving to outer level
 * Should work ok with more than one repair at a time, but untested.
 *
 * Detect \.source\. keys with subnested snippets (only being done in dart extension)
 * defend against weird {.source.dart: {…}} snippet structure
 * see /Users/andy/.vscode/extensions/dart-code.dart-code-3.13.2/snippets/dart.json
 *
 * @param {dict} snippets Dictionary object with a
 * Returns new dict
 */
function repairWeirdNestedSnippets(snippets) {
  let weirdKeys = [];
  Object.keys(snippets).forEach((key) => {
    if (key.includes(".source.")) {
      // console.warn(`detected bad snippet structure ${key}`);
      weirdKeys.push(key);
    }
  });
  if (weirdKeys.length > 0) {
    // console.log(`repairing weird keys ${weirdKeys}...`);
    let newSnippets = {};
    weirdKeys.forEach((key) => {
      Object.assign(newSnippets, snippets[key]);
    });
    snippets = newSnippets;
  }
  return snippets;
}
exports.repairWeirdNestedSnippets = repairWeirdNestedSnippets;
