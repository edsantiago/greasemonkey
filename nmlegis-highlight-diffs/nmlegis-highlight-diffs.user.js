// ==UserScript==
// @name         nmlegis-highlight-diffs
// @namespace    https://github.com/edsantiago/greasemonkey
// @downloadURL  https://raw.githubusercontent.com/edsantiago/greasemonkey/master/nmlegis-highlight-diffs/nmlegis-highlight-diffs.user.js
// @description  highlight diffs in nmlegis.gov bills
// @include      https://nmlegis.gov/*/bills/*.html
// @version      1.0
// @grant        none
// ==/UserScript==

/*
** Changelog
**
**  2023-01-14  1.0  Initial version
*/
var allSpans, thisSpan;

/*
** Unfortunately, nmlegis does not use CSS classes like "removed"/"added".
** They hardcode line-through and underline.
*/

// line-through = deleted text
allSpans = document.evaluate(
    '//span[contains(@style,"line-through")]',
    document,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null);
for (var i = 0; i < allSpans.snapshotLength; i++) {
    thisSpan = allSpans.snapshotItem(i);
    thisSpan.style["background"] = "#ccc";
}

// underline = added text
allSpans = document.evaluate(
    '//span[contains(@style,"underline")]',
    document,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null);
for (var i = 0; i < allSpans.snapshotLength; i++) {
    thisSpan = allSpans.snapshotItem(i);
    thisSpan.style["color"] = "#930";
    thisSpan.style["font-weight"] = "bold";
}
