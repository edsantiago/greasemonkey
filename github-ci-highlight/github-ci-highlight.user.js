// ==UserScript==
// @name        github-ci-highlight
// @namespace   https://github.com/edsantiago/greasemonkey
// @downloadURL https://raw.githubusercontent.com/edsantiago/greasemonkey/master/github-ci-highlight/github-ci-highlight.user.js
// @description highlight 'sys/int podman/remote fedora/ubuntu root/rootless'
// @include     /.*/containers/podman/pull/
// @include     /cirrus-ci.com/build/
// @require     https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.2/waitForKeyElements.js
// @version     0.12
// @grant       none
// ==/UserScript==

/*
** Changelog:
**
**  2022-06-16  0.12  vivify links to annotated log
**  2022-06-16  0.11  run on cirrus-ci.com/build/BUILD-ID
**  2022-06-16  0.10  colorize "podman" (purple) and "compose test"
**  2022-01-17  0.09  github changed their html. The 'int podman etc' stuff
**                    is now inside <strong title="int podman etc">, so we
**                    have to avoid tweaking that title. And Queued/InProgress
**                    is now in <span>, but (sigh) Successful is not.
**  2021-11-10  0.08  preserve whitespace (in Validate step)
**  2021-03-24  0.07  highlight new bud, Upgrade tests
**  2020-11-05  0.06  deemphasize the always-failing "rdoproject" test
**  2020-10-27  0.05  highlight Task Summary (Queued, In Progress, Failing,..)
**  2020-10-27  0.04  highlight APIv2 and Unit
**  2020-10-26  0.03  simplify, and highlight *all* instances of fedora/etc
**  2020-10-26  0.02  remove space between tokens, make color blocks abut.
**  2020-10-26  0.01  initial revision
*/

/*
** Add a set of styles for different log levels and parts of each log.
*/
function add_css() {
    var head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
.ci-bud       { padding: 0px 2px; background: #fc0; color: #000; }
.ci-compose   { padding: 0px 2px; color: #660; }
.ci-int       { padding: 0px 2px; background: #960; }
.ci-sys       { padding: 0px 2px; background: #cf9; }
.ci-podman    { padding: 0px 2px; color: #892ca0; }
.ci-remote    { padding: 0px 2px; background: #f9f; }
.ci-fedora    { padding: 0px 2px; background: #294172; color: #adf; }
.ci-ubuntu    { padding: 0px 2px; background: #e95420; color: #fff; }
.ci-root      { padding: 0px 2px; }
.ci-rootless  { padding: 0px 2px; background: #ccc; color: #333; }
.ci-host      { padding: 0px 2px; }
.ci-container { padding: 0px 2px; background: #9cf; }
.ci-APIv2     { padding: 0px 2px; background: #c0c; color: #fff; }
.ci-Unit      { padding: 0px 2px; background: #f99; }
.ci-Upgrade   { padding: 0px 2px; color: #f0c; }

/* The "Task summary" just to the right of the test name */
.summary-queued     { color: #aaa; }
.summary-inprogress { font-weight: bold; color: #06c; background: #fff; }
.summary-successful { font-weight: bold; color: #0a0; }
.summary-cancelled  { color: #C00; text-decoration: line-through; }
.summary-failing    { background: #F00; color: #fff; }
.summary-pending    { background: #ccc; color: #000; }

.boring             { color: #ccc; }
`;

    head.appendChild(style);
}


/*
** Find all <pre> sections in document, then highlight line by line.
*/
/*
** FIXME: how to rerun on AJAX updates?
**   https://stackoverflow.com/questions/10134785/how-can-i-run-a-greasemonkey-function-after-an-ajax-update
**   https://stackoverflow.com/questions/8281441/fire-greasemonkey-script-on-ajax-request/8283815#8283815
**
** Best (no jquery):
**   https://github.com/CoeJoder/waitForKeyElements.js
*/

function highlight_int_sys_etc(element) {
    // Each token is unique, except for fedora & ubuntu which include -version
    element.innerHTML = element.innerHTML.replace(/\b(bud|int|sys|podman|remote|(fedora|ubuntu)-\S+|root|rootless|host|container|APIv2|Unit|Upgrade)(\s*)\b/g, function(match, token, fu, ws) {
        var css = fu;              // may be just 'fedora' or 'ubuntu'
        if (fu == null) {
            css = token;           // nope, empty, it's int|sys|podman|etc
        }
        var newhtml = "<span class=\"ci-"+css+"\">"+token+"</span>"+ws;
        return newhtml;
    });

    // Special case for "compose test" / "compose_v2 test"
    element.innerHTML = element.innerHTML.replace(/\b(compose\S* test)/, function(match, compose) {
        return "<span class=\"ci-compose\">" + compose + "</span>";
    });

    /* The "Task summary" just to the right of the test name */
    element.innerHTML = element.innerHTML.replace(/((Queued|In progress|Successful|Cancelled|Failing|Pending).*)/, function(match, summaryline, token) {
        return "<span class=\"summary-"+token.replace(/\s/g,'').toLowerCase()+"\">"+summaryline+"</span>";
    });

    /* This is a worthless CI check that always fails; we don't care */
    element.innerHTML = element.innerHTML.replace(/(rdoproject\S+)/, function(match, rdo) {
        return "<span class=\"boring\">" + rdo + "</span>";
    });
}

function highlight_state(element) {
    /* The "Task summary" just to the right of the test name */
    element.innerHTML = element.innerHTML.replace(/((Queued|In progress|Successful|Cancelled|Failing|Pending).*)/, function(match, summaryline, token) {
        return "<span class=\"summary-"+token.replace(/\s/g,'').toLowerCase()+"\">"+summaryline+"</span>";
    });

    /* This is a worthless CI check that always fails; we don't care */
    element.innerHTML = element.innerHTML.replace(/(rdoproject\S+)/, function(match, rdo) {
        return "<span class=\"boring\">" + rdo + "</span>";
    });
}

/*
** Makes the "Annotated results" URL clickable
*/
function vivify_log_links(element) {
    element.innerHTML = element.innerHTML.replace(/ (https:\S+\.log\.html)/,
                                                  function(match, url) {
                                                      return " <a href=\"" + url + "\" target=\"_blank\">" + url + "</a>";
                                                  });
}


/*
** waitForKeyElements("div.comments", (element) => {
**   element.innerHTML = "This text inserted by waitForKeyElements().";
** });
*/
waitForKeyElements("div.merge-status-item > div.col-10 > strong",
                   highlight_int_sys_etc, false);
waitForKeyElements("div.merge-status-item > div.col-10",
                   highlight_state, false);
waitForKeyElements("a.SideNav-subItem > span",
                   highlight_int_sys_etc, false);

// https://cirrus-ci.com/build/NNNNN (long vertical list of all tasks)
waitForKeyElements("span.MuiChip-label",
                   highlight_int_sys_etc, false);

// vivify links to annotated log; triggers on github CI-summary page
waitForKeyElements("pre > span.pl-c1",
                   vivify_log_links, false);

window.addEventListener("load", add_css, false);
