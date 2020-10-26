// ==UserScript==
// @name        github-ci-highlight
// @namespace   https://github.com/edsantiago/greasemonkey
// @downloadURL https://raw.githubusercontent.com/edsantiago/greasemonkey/master/github-ci-highlight/github-ci-highlight.user.js
// @description highlight 'sys/int podman/remote fedora/ubuntu root/rootless'
// @include     /.*/containers/podman/pull/
// @require     https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.2/waitForKeyElements.js
// @version     0.001
// @grant       none
// ==/UserScript==

/*
** Changelog:
**
**  2020-10-26  0.01  initial attempt
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
.ci-int       { padding: 2px; background: #960; }
.ci-sys       { padding: 2px; background: #cf9; }
.ci-podman    { }
.ci-remote    { padding: 2px; background: #f9f; }
.ci-fedora    { padding: 2px; background: #294172; color: #adf; }
.ci-ubuntu    { padding: 2px; background: #e95420; color: #fff; }
.ci-root      { }
.ci-rootless  { padding: 2px; background: #ccc; color: #333; }
.ci-host      { }
.ci-container { padding: 2px; background: #9cf; }
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
    element.innerHTML = element.innerHTML.replace(/(int|sys)\s+(podman|remote)\s+((fedora|ubuntu)-\S+)\s+(root|rootless)\s+(host|container)/, function(match, intsys, client, full_os, os, root, hostcontainer) {
        var newhtml = "<span class=\"ci-"+intsys+"\">"+intsys+"</span>";
        newhtml += " <span class=\"ci-"+client+"\">"+client+"</span>";
        newhtml += " <span class=\"ci-"+os+"\">"+full_os+"</span>";
        newhtml += " <span class=\"ci-"+root+"\">"+root+"</span>";
        newhtml += " <span class=\"ci-"+hostcontainer+"\">"+hostcontainer+"</span>";
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

window.addEventListener("load", add_css, false);
