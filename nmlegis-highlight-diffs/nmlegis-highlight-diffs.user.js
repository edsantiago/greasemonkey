// ==UserScript==
// @name         nmlegis-highlight-diffs
// @namespace    https://github.com/edsantiago/greasemonkey/nmlegis-highlight-diffs
// @downloadURL  https://raw.githubusercontent.com/edsantiago/greasemonkey/master/nmlegis-highlight-diffs/nmlegis-highlight-diffs.user.js
// @description  highlight diffs in nmlegis.gov bills
// @include      /https:\/\/nmlegis\.gov\/.*\/(bills|memorials|resolutions)\/.*\.html/
// @version      1.4
// @grant        none
// ==/UserScript==

/*
** Changelog
**
**  2023-01-15  1.4  Duh, handle resolutions too
**  2023-01-15  1.3  Handle subsections (a-b-c.d) and "Chapter X, Article Y"
**  2023-01-14  1.2  Linkify sections of NM code
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
                                                    " <a href=\"https://nmlegis.gov/Legislation/Legislation?Chamber=$1&LegType=$2&LegNo=$3&year=23\">$1$2$3</a>");
}

// linkify sections of NM code
allSpans = document.evaluate(
    '//span[contains(text(),"NMSA")]',
    document,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null);
for (var i = 0; i < allSpans.snapshotLength; i++) {
    thisSpan = allSpans.snapshotItem(i);

    var s = thisSpan.innerHTML;

    // C-A-S.x NMSA
    s = s.replace(/ (\d+)-(\d+)-(\d+)\.(\d+) NMSA/,
                  " <a href=\"https://law.justia.com/codes/new-mexico/2021/chapter-$1/article-$2/section-$1-$2-$3-$4\" target=\"_blank\">$1-$2-$3.$4 NMSA</a>");

    // C-A-S NMSA
    s = s.replace(/(\d+)-(\d+)-(\d+) NMSA/,
                  " <a href=\"https://law.justia.com/codes/new-mexico/2021/chapter-$1/article-$2/section-$1-$2-$3\" target=\"_blank\">$1-$2-$3 NMSA</a>");

    // Chapter C, Section S
    s = s.replace(/Chapter (\d+\w*), Article (\d+) NMSA/,
                  function(match, chapter, article) {
                      return " <a href=\"https://law.justia.com/codes/new-mexico/2021/chapter-" + chapter.toLowerCase() + "/article-" + article + "\" target=\"_blank\">" + match + "</a>";
                  });

    thisSpan.innerHTML = s;
}
