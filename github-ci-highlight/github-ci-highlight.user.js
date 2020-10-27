// ==UserScript==
// @name        github-ci-highlight
// @namespace   https://github.com/edsantiago/greasemonkey
// @downloadURL https://raw.githubusercontent.com/edsantiago/greasemonkey/master/github-ci-highlight/github-ci-highlight.user.js
// @description highlight 'sys/int podman/remote fedora/ubuntu root/rootless'
// @include     /.*/containers/podman/pull/
// @require     https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.2/waitForKeyElements.js
// @version     0.03
// @grant       none
// ==/UserScript==

/*
** Changelog:
**
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
.ci-int       { padding: 0px 2px; background: #960; }
.ci-sys       { padding: 0px 2px; background: #cf9; }
.ci-podman    { padding: 0px 2px; }
.ci-remote    { padding: 0px 2px; background: #f9f; }
.ci-fedora    { padding: 0px 2px; background: #294172; color: #adf; }
.ci-ubuntu    { padding: 0px 2px; background: #e95420; color: #fff; }
.ci-root      { padding: 0px 2px; }
.ci-rootless  { padding: 0px 2px; background: #ccc; color: #333; }
.ci-host      { padding: 0px 2px; }
.ci-container { padding: 0px 2px; background: #9cf; }
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
    element.innerHTML = element.innerHTML.replace(/\b(int|sys|podman|remote|(fedora|ubuntu)-\S+|root|rootless|host|container)\s*\b/g, function(match, token, fu) {
        var css = fu;              // may be just 'fedora' or 'ubuntu'
        if (fu == null) {
            css = token;           // nope, empty, it's int|sys|podman|etc
        }
        var newhtml = "<span class=\"ci-"+css+"\">"+token+"</span>";
        return newhtml;
    });
}

/*
** waitForKeyElements("div.comments", (element) => {
**   element.innerHTML = "This text inserted by waitForKeyElements().";
** });
*/
waitForKeyElements("div.merge-status-item > div.col-10 > strong",
                   highlight_int_sys_etc, false);
waitForKeyElements("a.SideNav-subItem > span",
                   highlight_int_sys_etc, false);

window.addEventListener("load", add_css, false);
