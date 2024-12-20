// ==UserScript==
// @name        podman-ginkgo-highlight
// @namespace   https://github.com/edsantiago/greasemonkey
// @downloadURL https://raw.githubusercontent.com/edsantiago/greasemonkey/master/podman-ginkgo-highlight/podman-ginkgo-highlight.user.js
// @description highlight different-level messages in podman ginkgo logs
// @include     /.*/aos-ci/.*/containers/libpod/.*/output.log/
// @include     /.*/aos-ci/.*/containers/podman/.*/output.log/
// @include     /.*/baseos-ci/.*/test.*\.bats\.log/
// @include     /.*/ci-openstack-.*/.*/test.*\.bats\.log/
// @include     /.*cirrus-ci.com/.*task.*/
// @include     /.*artifacts.dev.testing-farm.io/.*/.*(str.*test|bats).log/
// @include     /.*/beaker-logs/.*/.*\.log/
// @include     /.*/beaker/logs/.*/.*\.log/
// @include     /.*/ci-artemis-mbs-sti/.*/artifact/.*\.bats\.log/
// @include     /.*softwarefactory-project.io/logs/.*/artifacts/.*podman/
// @include     /arr-cki-prod-datawarehouse-public/datawarehouse-public/.*taskout.log/
// @include     /.*datawarehouse.*results.*log/
// @include     /.*upshift\.redhat\.com/.*artifacts.*\.log/
// @include     /artifacts.osci.redhat.com/testing-farm/.*.log/
// @include     /osci-jenkins-1.ci.fedoraproject.org/job/fedora-ci/job/dist-git-pipeline/
// @include     /openqa.fedoraproject.org/tests/.*/podman-podman-bats.txt/
//
// @version     0.37
// @grant       none
// ==/UserScript==

/*
** Changelog:
**
**  2024-08-19  0.37  run on OpenQA
**
**  2024-07-29  0.36  skip processing if page is already formatted
**
**  2023-09-18  0.35  more domains to handle (CKI)
**
**  2023-02-15  0.34  expand the testing-farm.io regex
**
**  2023-01-05  0.33  better formatting for failblock
**
**  2022-12-02  0.32  beaker-logs: handle *.log, not just taskout.log
**
**  2022-03-31  0.31  recognize more podman options (e.g. netavark), and
**                    allow '--foo=bar' as well as '--foo bar'. And, ghost out
**                    debug messages in e2e tests.
**  2022-03-03  0.30  add 'fatal' to list of errors from 0.29
**  2022-03-01  0.29  highlight "time= level=error msg=...." lines. Change
**                    decoration of FAIL blocks so they don't look the same.
**
**  2022-02-28  0.28  add buildah bodhi
**
**  2022-01-19  0.27  add artifacts.osci.redhat.com
**
**  2022-01-10  0.26  minor one-character tweak to multiarch
**  2022-01-06  0.25  datawarehouse, used in multiarch CI
**
**  2021-09-13  0.24  softwarefactory, used in Fedora CI
**
**  2021-07-06  0.23  another internal beaker URL
**
**  2021-04-28  0.22  another internal beaker URL
**
**  2021-02-24  0.21  trigger on internal RH Beaker
**
**  2021-02-06  0.20  highlight buildah conformance tests (just a rough try)
**
**  2021-01-13  0.19  trigger on more internal RH CI
**
**  2021-01-05  0.18  handle RHEL gating-test URLs
**
**  2020-11-30  0.17  trigger on new bodhi CI
**
**  2020-09-30  0.16  better readability for command lines
**
**  2020-06-22  0.15  timestamps: remove same-as-before
**
**  2020-06-11  0.14  ignore "--remote" and "--url"
**
**  2020-06-09  0.13  handle new /libpod/define.gitCommit= format
**  2020-06-09  0.12  handle events-backend flag
**
**  2020-05-19  0.11  handle podman-remote command; newline-separate options
**
**  2020-04-22  0.10  handle BATS output as well (for buildah logs)
**                    - include a summary line at bottom with pass/fail/skip
**
**  2019-06-12  0.09  remove duplicate lines; deemphasize timestamp
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
.log-fatal { color: #E00; font-weight: bold; }
.subtest   { background: #eee; }
.subsubtest { color: #F39; font-weight: bold; }
.string    { color: #00c; }
.command   { font-weight: bold; color: #000; }
.changed   { color: #000; font-weight: bold; }

/* BATS styles */
.bats-passed    { color: #393; }
.bats-failed    { color: #F00; font-weight: bold; }
.bats-skipped   { color: #F90; }
.bats-log       { color: #933; }
.bats-log-failblock  { color: #b00; background-color: #fee; display: inline-flex; margin: 0 -500%; padding: 0 500% !important; }

.bats-summary   { font-size: 150%; }

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
    // Do not process already-formatted pages
    if (document.querySelector(".synopsis")) {
      return;
    }

    add_css();

    var in_failure = 0;
    var after_divider = 0;

    var previous_ts = '';
    var git_commit;
    var looks_like_bats = 0;
    var looks_like_conformance = 0;
    var bats_count = { total: 0, passed: 0, failed: 0, skipped: 0 };

    // There's probably only one <pre> in the document, but allow more
    var pres = document.getElementsByTagName("pre")
    for (var i=0; i < pres.length; i++) {
        var pre = pres[i];

        var current_output = '';         // for removing duplication
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
                if (ts == previous_ts) {
                    ts = ' '.repeat(ts.length);
                }
                else {
                    previous_ts = ts;
                }
            }

            // Identify the git commit we're working with
            var git_commit_match = line.match(/(libpod|podman)(\/define)?.gitCommit=([0-9a-f]+)/);
            if (git_commit_match) {
                git_commit = git_commit_match[3];
            }
            // ...so we can link to particular lines in source files
            if (git_commit) {
                //                    1  12  3                 34     4 5   526  6
                line = line.replace(/^(.*)(\/(containers\/[^/]+)(\/\S+):(\d+))(.*)$/,
                                    "$1<a class=\"codelink\" href='https://github.com/$3/blob/" +
                                    git_commit + "$4#L$5'>$2</a>$6");
            }

            // diagnostic messages from podman
            line = line.replace(/ level=(debug|info|warn|error|fatal)(\S*)\s+msg=(.*)/, " level=<span class=\"log-$1\">$1$2</span> msg=<span class=\"log-$1\">$3</span>");

            // BATS handling (used also for apiv2 tests, which emit TAP output)
            var bats_found = line.match(/^1\.\.(\d+)$/);
            if (bats_found || line.match(/\/test-apiv2/)) {
                looks_like_bats = 1;
                if (bats_found) {
                    bats_count['expected_total'] = bats_found[1]
                }
            }
            if (looks_like_bats) {
                var css = '';

                if      (line.match(/^ok .* # skip/)) { css = 'skipped' }
                else if (line.match(/^ok /))          { css = 'passed'  }
                else if (line.match(/^not ok /))      { css = 'failed'  }
                else if (line.match(/^# #(\/v|\| |\\\^)/)) { css = 'log-failblock' }
                else if (line.match(/^# /))           { css = "log"     }

                // Two hashes, or hash-and-dollar, indicate a command.
                // Strip off the full path for readability; and make entire
                // line boldface to make it easier to find commands.
                line = line.replace(/^#\s(#|\$)\s(\/\S+\/(\S+))(.*)/, "# $1 <b><span title=\"$2\">$3</span>$4</b>");

                if (css != '') {
                    bats_count[css]++
                    line = "<span class='bats-" + css + "'>" + line + "</span>";
                }

                if (ts) {
                    lines_out += "<span class=\"timestamp\">" + ts + "</span>"
                }
                lines_out += line + "\n"
                continue
            }

            // 2021-02-06 for buildah conformance tests
            if (line.match(/=== RUN\s+TestConformance/)) {
                looks_like_conformance = 1;
            }
            if (looks_like_conformance) {
                if (line.match(/^make:/)) {
                    // Done with conformance testing report
                    looks_like_conformance = 0;
                }

                // RUN line; may be followed by failed test results
                var css = '';
                var m = line.match(/^=== RUN\s+(\S+)/);
                if (m) {
                    id = m[1].replace('/','-');
                    line = "<a name=\"t--"+id+"\">" + line + "</a>";
                }

                // PASS/FAIL at the end
                m = line.match(/^\s*--- (PASS|FAIL):\s+(\S+\/\S+)/);
                if (m) {
                    css = m[1].toLowerCase() + 'ed';
                    line = line.replace(m[2], "<a href=\"#t--"+m[2].replace('/','-')+"\">"+m[2]+"</a>");
                }

                // FIXME: lines that otherwise start with spaces are errors
                else {
                    if (line.match(/^\s+/)) {
                        css = 'log';
                    }
                }

                if (css != '') {
                    line = "<span class='bats-"+css+"'>" + line + "</span>";
                }
                if (ts) {
                    lines_out += "<span class=\"timestamp\">" + ts + "</span>";
                }
                lines_out += line + "\n";
                continue;
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
                // "--remote" takes no args; just remove it entirely
                line = line.replace(/\s+--remote\s+/g, ' ');
                // Highlight the important (non-boilerplate) podman command
                line = line.replace(/(\S+\/podman(-remote)?)((\s+--(root|runroot|runtime|tmpdir|storage-opt|conmon|cgroup-manager|cni-config-dir|log-level|storage-driver|syslog|events-backend|network-backend|network-config-dir|url)[ =]\S+)*)(.*)/, function(match, commandpath, remote, options, foo1, foo2, rest) {
                    var newline = "<span title=\"" + commandpath + "\"><b>podman";
                    if (remote) {
                        newline += remote;
                    }
                    newline += "</b></span>";
                    if (options) {
                        newline += " <span class=\"boring\" title=\"" + options.replace(/ --/g, "\n--") + "\">[options]</span>";
                    }
                    newline += "<b>" + rest + "</b>";
                    return newline;
                });

                current_output = '';
            }
            // Grrr. 'output:' usually just tells us what we already know.
            else if (line.match(/^output:/)) {
                if (line == 'output: ' + current_output.trim().replace(/\s+/g, ' ') || line == 'output: ') {
                    continue;
                }
            }
            else if (line.match(/^Error:/)) {
                line = "<span class='log-warn'>" + line + "</span>";
            }
            else {
                current_output += ' ' + line;
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

            lines_out += "<span class=\"timestamp\">" + ts + "</span>" + line + "\n";
        }

        // BATS summary
        if (looks_like_bats) {
            lines_out += "<hr/><span class='bats-summary'>Summary:";
            var total = 0
            var comma = ''

            const kinds = [ 'passed', 'failed', 'skipped' ]
            for (const kind of kinds) {
                var n = bats_count[kind]
                if (n) {
                    lines_out += comma + " <span class='bats-" + kind + "'>" + n + " " + kind + "</span>"
                    total += n
                    comma = ','
                }
            }

            lines_out += ". Total tests: " + total

            if (bats_count['expected_total']) {
                if (total != bats_count['expected_total']) {
                    lines_out += " <span class='bats-failed'>(WARNING: expected "+ bats_count['expected_total'] + ")</span>"
                }
            }
            lines_out += "</span>\n"
        }

        pre.innerHTML = lines_out;
    }

    window.scrollTo(0, document.body.scrollHeight);
}

window.addEventListener("load", htmlify, false);
