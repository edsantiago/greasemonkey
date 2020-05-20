// ==UserScript==
// @name         bats-highlight
// @namespace    https://github.com/edsantiago/greasemonkey
// @downloadURL  https://raw.githubusercontent.com/edsantiago/greasemonkey/master/bats-highlight/bats-highlight.user.js
// @description  highlight BATS results
// @include      /.*/job/ci-openstack-mbs-sti/.*/artifact/.*/test.*\.bats\.log/
// @include      /.*/artifact/package-tests/logs/FAIL-.*/
// @include      /.*/baseos-ci/.*/test.*\.bats\.log/
// @include      /.*cirrus-ci.com/.*task.*/logs/.*\.log/
// @include      /.*jenkins-continuous-infra/
// @version      1.2
// @grant        none
// ==/UserScript==

/*
** Changelog
**
** 2020-05-20  1.2   trigger in jenkins; deemphasize timestamps
**
** 2019-12-03  1.1   new URLs in gating tests
**
** 2019-11-12  1.0   highlight skips
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
.boring    { color: #999; }
.ok        { color: #3f3; }
.notok     { color: #F00; font-weight: bold; }
.skip      { color: #F90; }
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
            var ts = '';		// timestamp
            var css = '';

            // Look for leading timestamp; deemphasize it
            var ts_found = line.match(/^(\[\d+-\d+-\d+T\d+:\d+:[\d.]+Z\]\s+)(.*)/);
            if (ts_found) {
                ts = "<span class='boring'>" + ts_found[1] + "</span>";
                line = ts_found[2];
            }

            if (line.match(/^ok .* # skip/)) {
                css = 'skip';
            }
            else if (line.match(/^ok /)) {
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

            lines_out += ts + line + "\n";
        }

        pre.innerHTML = lines_out;
    }
}

window.addEventListener("load", htmlify, false);
