// ==UserScript==
// @name         nmlegis-highlight-diffs
// @namespace    https://github.com/edsantiago/greasemonkey
// @downloadURL  https://raw.githubusercontent.com/edsantiago/greasemonkey/master/nmlegis-highlight-diffs/nmlegis-highlight-diffs.user.js
// @description  highlight diffs in nmlegis.gov bills
// @include      https://nmlegis.gov/*/bills/*.html
// @version      1.1
// @grant        none
// ==/UserScript==

/*
** Changelog
**
**  2023-01-14  1.1  Linkify bill in title
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

// page title: linkify bill
allSpans = document.evaluate(
    '//html/body/div[1]/p[1]',
    document,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null);
for (var i = 0; i < allSpans.snapshotLength; i++) {
    thisSpan = allSpans.snapshotItem(i);
		thisSpan.innerHTML = thisSpan.innerHTML.replace(/ ([HS])(B|CR|M|JR)0*([0-9]+)/,
                                                    " <a href=\"https://nmlegis.gov/Legislation/Legislation?Chamber=$1&LegType=$2&LegNo=$3&year=23\"><b>$1$2$3</b></a>");
}
