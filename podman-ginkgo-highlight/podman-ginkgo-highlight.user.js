// ==UserScript==
// @name        podman-ginkgo-highlight
// @namespace   https://github.com/edsantiago/greasemonkey
// @downloadURL https://raw.githubusercontent.com/edsantiago/greasemonkey/master/podman-ginkgo-highlight/podman-ginkgo-highlight.user.js
// @description highlight different-level messages in podman ginkgo logs
// @include     /.*/aos-ci/.*/containers/libpod/.*/output.log/
// @include     /.*cirrus-ci.com/.*task.*/
// @version     0.08
// @grant       none
// ==/UserScript==

/*
** Changelog:
**
**  2019-06-12  0.08  handle 'Panic'; handle non-Podman test names
**
**  2019-06-12  0.07  display headings inline; deemphasize source code links;
**                    handle 'BeforeEach' failures.
**
**  2019-06-11  0.06  slightly better higlights
**
**  2019-06-11  0.05  highlight useful parts of executed podman commands
**
**  2019-05-10  0.04  if we see /containers/libpod/foo:NN, link to it
**
**  2019-05-10  0.03  scroll to bottom of page on load
**
**  2019-05-10  0.02  handle new timestamp format
**
**  2019-03-20  0.01  initial revision
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
.timestamp { color: #999; }
.log-debug { color: #999; }
.log-info  { color: #333; }
.log-warn  { color: #f60; }
.log-error { color: #900; font-weight: bold; }
.subtest   { background: #eee; }
.subsubtest { color: #F39; font-weight: bold; }
.string    { color: #00c; }
.command   { font-weight: bold; color: #000; }
.changed   { color: #000; font-weight: bold; }

/* links to source files: not as prominent as links to errors */
a.codelink:link    { color: #000; }
a.codelink:visited { color: #666; }
a.codelink:hover   { background: #000; color: #999; }

/* error titles: display next to timestamp, not on separate line */
h2 { display: inline; }
`;

    head.appendChild(style);
}


/*
** Find all <pre> sections in document, then highlight line by line.
*/
function htmlify() {
    add_css();

    var in_failure = 0;
    var after_divider = 0;

    var git_commit;

    // There's probably only one <pre> in the document, but allow more
    var pres = document.getElementsByTagName("pre")
    for (var i=0; i < pres.length; i++) {
        var pre = pres[i];

        var lines = pre.innerHTML.split('\n');
        var lines_out = '';

        for (var j=0; j < lines.length; j++) {
            var line = lines[j];

            // Strip off leading timestamp
            var ts = '';                  // timestamp
            var ts_found = line.match(/^(\[\+\d+s\] )(.*)/);
            if (ts_found) {
                ts = ts_found[1];
                line = ts_found[2];
            }

            // Identify the git commit we're working with
            var git_commit_match = line.match(/libpod.gitCommit=([0-9a-f]+)/);
            if (git_commit_match) {
                git_commit = git_commit_match[1];
            }
            // ...so we can link to particular lines in source files
            if (git_commit) {
                //                    1  12  3                  34     4 5   526  6
                line = line.replace(/^(.*)(\/(containers\/libpod)(\/\S+):(\d+))(.*)$/,
                                    "$1<a class=\"codelink\" href='https://github.com/$3/blob/" +
                                    git_commit + "$4#L$5'>$2</a>$6");
            }

            // WEIRD: sometimes there are UTF-8 binary chars here
            if (line.match(/^.{0,4} (Failure|Panic)( in .*)? \[/)) {
                // Begins a block of multiple lines including a stack trace
                lines_out += "<div class='log-error'>\n";
                in_failure = 1;
            }
            else if (line.match(/^-----------/)) {
                if (in_failure) {
                    // Ends a stack trace block
                    in_failure = 0;
                    lines_out += "</div>\n";
                }
                after_divider = 0;
            }
            else if (line.match(/^Running:/)) {
                // Highlight the important (non-boilerplate) podman command
                line = line.replace(/(\S+\/podman)((\s+--(root|runroot|runtime|tmpdir|storage-opt|conmon|cgroup-manager|cni-config-dir|storage-driver) \S+)*)(.*)/,
                                    "<span title=\"$1\"><b>podman</b></span> <span class=\"boring\" title=\"$2\">[options]</span><b>$5</b>");
            }
            else if (line.match(/^Error:/)) {
                line = "<span class='log-warn'>" + line + "</span>";
            }

            // Two lines after each divider, there's a test name. Make it
            // an anchor so we can link to it later.
            if (after_divider++ == 2) {
                // Sigh. There is no actual marker. Assume that anything with
                // two leading spaces then alpha (not slashes) is a test name.
                if (line.match(/^  [a-zA-Z]/)) {
                    var id = line.trim().replace(/[^a-zA-Z0-9_-]/g, '-');
                    line = "<a name='t--" + id + "'><h2>" + line + "</h2></a>"
                }
            }

            // Failure name corresponds to a previously-seen block.
            // FIXME: sometimes there are three failures with the same name.
            //        ...I have no idea why or how to link to the right ones.
            var end_fail = line.match(/^(\[(Fail|Panic!)\] .* \[(It|BeforeEach)\] )([A-Za-z].*)/);
            if (end_fail) {
                line = "<b>" + end_fail[1] + "<a href='#t--" + end_fail[4].trim().replace(/[^a-zA-Z0-9_-]/g, '-') + "'>" + end_fail[4] + "</a></b>";
            }

            lines_out += ts + line + "\n";
        }

        pre.innerHTML = lines_out;
    }

    window.scrollTo(0, document.body.scrollHeight);
}

window.addEventListener("load", htmlify, false);
