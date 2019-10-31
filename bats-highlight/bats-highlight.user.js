// ==UserScript==
// @name         bats-highlight
// @namespace    https://github.com/edsantiago/greasemonkey
// @downloadURL  https://raw.githubusercontent.com/edsantiago/greasemonkey/master/bats-highlight/bats-highlight.user.js

// @description  highlight BATS results
// @include      /.*/job/ci-openstack-mbs-sti/.*/artifact/.*/test.*\.bats\.log/
// @include      /.*/artifact/package-tests/logs/FAIL-.*/
// @version      0.9
// @grant        none
// ==/UserScript==

/*
** Add a set of styles for different log levels and parts of each log.
*/
function add_css() {
    var head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
.boring    { color: #999; }
.ok        { color: #3f3; }
.notok     { color: #F00; font-weight: bold; }
.log       { color: #900; }
.log-esm   { color: #b00; font-weight: bold; }
`;

    head.appendChild(style);
}


/*
** Find all <pre> sections in document, then highlight line by line.
*/
function htmlify() {
    add_css();

    // There's probably only one <pre> in the document, but allow more
    var pres = document.getElementsByTagName('pre');
    for (var i=0; i < pres.length; i++) {
        var pre = pres[i];

        var current_output = '';         // for removing duplication
        var lines = pre.innerHTML.split('\n');
        var lines_out = '';

        for (var j=0; j < lines.length; j++) {
            var line = lines[j];
            var css = '';

            if (line.match(/^ok /)) {
                css = 'ok';
            }
            else if (line.match(/^not ok /)) {
                css = "notok";
            }
            else if (line.match(/^# #\| /)) {
                css = 'log-esm';
            }
            else if (line.match(/^# /)) {
                css = "log";
            }

            if (css != '') {
                line = "<span class='" + css + "'>" + line + "</span>";
            }

            lines_out += line + "\n";
        }

        pre.innerHTML = lines_out;
    }
}

window.addEventListener("load", htmlify, false);
