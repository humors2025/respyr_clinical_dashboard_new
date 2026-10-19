<?php
// URL parameters only. Everything else on this page — the subject's
// demographics and the BMI/BMR maths — is fetched and computed in
// JavaScript against the Node dashboard backend, using the logged-in
// user's own token. No server-side cURL, and no shared internal key.
$login_iddata   = $_GET['login_id']   ?? '';
$profile_iddata = $_GET['profile_id'] ?? '';
$profile_name   = $_GET['name']       ?? '';
?>

<!DOCTYPE html>
<html lang="en">
    <?php include "head.php"; ?>

    <style>
        .scorechart-chart-wrapper {
            width: 100%;
            height: 100%; /* fills the fixed-height card */
            position: relative;
            min-width: 0; /* grid item must not stretch to the wide inner plot */
            overflow: hidden;
        }
        .tab-content-wrapper .tab-row > * {
            min-width: 0; /* keep both cards at their grid-assigned widths */
        }

        .scorechart-chart-wrapper #scoreChart {
            width: 100% !important;
            height: 100% !important;
        }
        /* horizontally scrollable plot — fixed room per reading, never squashed */
        .rsp-chart-scroll {
            width: 100%;
            height: 100%;
            overflow-x: auto;
            overflow-y: hidden;
        }
        .rsp-chart-scroll::-webkit-scrollbar { height: 8px; }
        .rsp-chart-scroll::-webkit-scrollbar-track { background: transparent; }
        .rsp-chart-scroll::-webkit-scrollbar-thumb { background: #c8d3e2; border-radius: 8px; }
        .rsp-chart-inner {
            height: calc(100% - 10px);
            min-width: 100%;
            position: relative;
        }
        .card-first {
            justify-content: start;
        }
    </style>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

    <body>
        <script>if (!localStorage.getItem("jwt_token")) location.href = "./clinical-v2/";</script>
        <script>
            // Go back that can't get stuck: history.back() only when the
            // previous entry is another page of this app; otherwise (and if
            // the back navigation doesn't actually happen within 700ms,
            // e.g. a dead or redirecting entry) fall through to Test history.
            function rspGoBack() {
                const fallback = function () { location.href = "./history"; };
                const ref = document.referrer || "";
                const sameApp = ref.indexOf(location.origin) === 0 && ref.indexOf("view-profile") === -1 && ref.indexOf("clinical-v2") === -1;
                if (history.length > 1 && sameApp) {
                    const t = setTimeout(fallback, 700);
                    window.addEventListener("pagehide", function () { clearTimeout(t); }, { once: true });
                    history.back();
                } else {
                    fallback();
                }
            }
        </script>
        <?php include "./pages/sidebar.php" ?>
        <main class="main-wrapper">
            <?php include "pages/header_no_date.php" ?>

            <section class="section new-dashboard">
                <div class="container-fluid">
                    <!-- Page heading + score tabs span the full width, so the
                         profile card and the chart/history cards all start level -->
                    <div class="vp-topbar">
                         <h1 class="rsp-pagetitle">Profile Details</h1>
                    </div>

                    <div class="row">
                        <div class="col-xl-3 col-lg-4 col-sm-12">
                            <div class="icon-card-2 card-first mb-30">
                                <div class="profile-wrapper">
                                    <div class="card-header">
                                        <button type="button" onclick="rspGoBack()">
                                                <svg width="34" height="32" viewBox="0 0 34 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M24 16.75C24.4142 16.75 24.75 16.4142 24.75 16C24.75 15.5858 24.4142 15.25 24 15.25V16.75ZM8.46967 15.4697C8.17678 15.7626 8.17678 16.2374 8.46967 16.5303L13.2426 21.3033C13.5355 21.5962 14.0104 21.5962 14.3033 21.3033C14.5962 21.0104 14.5962 20.5355 14.3033 20.2426L10.0607 16L14.3033 11.7574C14.5962 11.4645 14.5962 10.9896 14.3033 10.6967C14.0104 10.4038 13.5355 10.4038 13.2426 10.6967L8.46967 15.4697ZM24 16V15.25H9V16V16.75H24V16Z"
                                                        fill="#252525"
                                                    />
                                                </svg>

                                                Go back
                                        </button>
                                    </div>

                                    <?php
                                        $ini = strtoupper(substr(trim($profile_name !== '' ? $profile_name : '?'), 0, 1));
                                        $avColors = ['#308bf9', '#3faf58', '#e48326', '#8e44ad', '#0ea5a4', '#e74c3c', '#6366f1', '#d97706'];
                                        $av = $avColors[ord($ini) % count($avColors)];
                                    ?>
                                    <div class="rsp-avatar rsp-avatar--xl" style="background:<?php echo $av; ?>1a;color:<?php echo $av; ?>"><?php echo htmlspecialchars($ini); ?></div>

                                    <h2><?php echo htmlspecialchars($profile_name, ENT_QUOTES); ?></h2>
                                    <div class="age-wrapper">
                                        <p>
                                            <span id="vpAge">—</span>
                                            years
                                        </p>
                                        <div class="dot"></div>
                                        <p id="vpGender">—</p>
                                    </div>

                                    <table>
                                        <tr>
                                            <th>Subject Id</th>
                                            <td><?php echo htmlspecialchars($profile_iddata, ENT_QUOTES); ?></td>
                                        </tr>

                                        <tr>
                                            <th>Height</th>
                                            <td id="vpHeight">—</td>
                                        </tr>

                                        <tr>
                                            <th>Weight</th>
                                            <td id="vpWeight">—</td>
                                        </tr>

                                        <tr>
                                            <th>BMI</th>
                                            <td id="vpBmi">—</td>
                                        </tr>

                                        <tr>
                                            <th>BMR</th>
                                            <td id="vpBmr">—</td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div class="col-xl-9 col-lg-8 col-sm-12">
                            <div class="tab-content-wrapper">
                                <div class="tab-row">
                                    <div class="icon-card-2 card-first vp-combo">
                                        <div class="vp-combohead">
                                            <div class="tab-button-wrapper">
                                                 <button class="btn_table_score active" id="btn-sugar-score">Sugar score</button>
                                                 <button class="btn_table_score" id="btn-liver-score">Liver score</button>
                                                 <button class="btn_table_score" id="btn-respiratory-score">Respiratory score</button>
                                                 <button class="btn_table_score" id="btn-gut-score">Gut score</button>
                                            </div>
                                            <!-- 1W/1M/3M look back from today; "Older" opens a
                                                 month picker that reaches the subject's FULL history,
                                                 past the 90-day window the other three use. -->
                                            <div class="vp-rangewrap">
                                                 <div class="rsp2-seg rsp2-seg-sm" id="graphRangeSeg">
                                                      <button type="button" data-days="7">1W</button>
                                                      <button type="button" data-days="30">1M</button>
                                                      <button type="button" class="on" data-days="90">3M</button>
                                                      <button type="button" id="btnOlder" data-days="older">
                                                           Older <i class="fa-solid fa-chevron-down"></i>
                                                      </button>
                                                 </div>
                                                 <div class="vp-monthpick" id="monthPick" hidden>
                                                      <div class="vp-monthpick-head">Jump to a month</div>
                                                      <div class="vp-monthpick-list" id="monthPickList">
                                                           <p class="vp-monthpick-empty">Loading…</p>
                                                      </div>
                                                 </div>
                                            </div>
                                        </div>
                                        <div class="vp-combobody">
                                            <div class="vp-graphside">
                                                <div class="vp-graphhead">
                                                    <span class="vp-graphrange" id="graphRangeLabel"></span>
                                                </div>
                                                <div class="rsp-chart-scroll" id="chartScroll">
                                                    <div class="rsp-chart-inner" id="chartInner">
                                                        <canvas id="scoreChart"></canvas>
                                                    </div>
                                                </div>
                                                <div class="rsp-empty" id="graphEmpty" style="display:none">
                                                    <strong>No tests in this range</strong>
                                                    <span>Try a longer range, or check the Test History list</span>
                                                </div>
                                            </div>
                                            <div class="vp-histside">
                                                <div class="title-wrapper">
                                                    <h3>Test History</h3>
                                                </div>
                                                <div class="vp-histscroll">
                                                    <table id="scoreTable">
                                                        <tbody></tbody>
                                                    </table>
                                                </div>
                                                <div class="rsp-history-foot" id="historyFootVP" style="display:none">
                                                    <span id="historyFootText"></span>
                                                    <button type="button" class="rsp2-showall" id="loadOlderBtn">Load older tests</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <?php include "footer.php"; ?>
        </main>
        <script src="assets/js/bootstrap.bundle.min.js"></script>
        <script src="assets/js/Chart.min.js"></script>
        <script src="assets/js/dynamic-pie-chart.js"></script>
        <script src="assets/js/moment.min.js"></script>
        <script src="assets/js/fullcalendar.js"></script>
        <script src="assets/js/jvectormap.min.js"></script>
        <script src="assets/js/world-merc.js"></script>
        <script src="assets/js/polyfill.js"></script>
        <script src="assets/js/main.js"></script>
        <script src="https://code.jquery.com/jquery-3.7.1.js"></script>
        <script src="https://cdn.datatables.net/2.3.0/js/dataTables.js"></script>
    
<script>
    // ---------------------------------------------------------------------
    // Subject demographics + BMI/BMR.
    //
    // This used to be a server-side cURL in PHP that authenticated with a
    // shared internal key — a key with no clinic identity, so anyone holding
    // it could read any clinic's patients. The browser already has the
    // logged-in user's token, so the fetch belongs here and the key is gone.
    // ---------------------------------------------------------------------
    const VP_PARAMS = {
        login_id: <?php echo json_encode($login_iddata); ?>,
        profile_id: <?php echo json_encode($profile_iddata); ?>,
        name: <?php echo json_encode($profile_name); ?>,
    };
    window.vpSubject = {};

    // Mifflin-St Jeor, same formula the PHP used.
    function vpBmiBmr(weightKg, heightCm, age, gender) {
        const w = parseFloat(weightKg), h = parseFloat(heightCm), a = parseInt(age, 10);
        if (!Number.isFinite(w) || !Number.isFinite(h) || h <= 0) return { bmi: null, bmr: null };
        const bmi = w / Math.pow(h / 100, 2);
        const g = String(gender || '').toLowerCase();
        let bmr = null;
        if (g === 'male') bmr = 10 * w + 6.25 * h - 5 * a + 5;
        else if (g === 'female') bmr = 10 * w + 6.25 * h - 5 * a - 161;
        return {
            bmi: Math.round(bmi * 100) / 100,
            bmr: bmr === null || !Number.isFinite(bmr) ? null : Math.round(bmr * 100) / 100,
        };
    }

    (function loadSubject() {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        const qs = new URLSearchParams({ login_id: VP_PARAMS.login_id, profile_id: VP_PARAMS.profile_id });
        fetch(`${window.NODE_API}/api/dashboard/profile-info?${qs}`, { headers: window.authHeaders() })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
            .then((d) => {
                window.vpSubject = d || {};
                const gender = String(d?.gender || '').toLowerCase();
                set('vpAge', d?.age ?? '—');
                set('vpGender', gender || '—');
                set('vpHeight', d?.height ? d.height + 'cm' : '—');
                set('vpWeight', d?.weight ? d.weight + 'kg' : '—');
                const { bmi, bmr } = vpBmiBmr(d?.weight, d?.height, d?.age, gender);
                set('vpBmi', bmi ?? '—');
                set('vpBmr', bmr === null ? '—' : bmr + 'Kcal');
            })
            .catch((err) => {
                // a subject can legitimately have no demographics row yet
                console.warn('profile-info:', err.message);
            });
    })();
</script>
</body>
</html>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
    // Select all buttons with class 'btn'
    const buttons = document.querySelectorAll(".btn_table_score");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            // Remove 'active' class from all buttons
            buttons.forEach((btn) => btn.classList.remove("active"));

            // Add 'active' class to the clicked button
            button.classList.add("active");
        });
    });
</script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3"></script>

<script>
    const ctx = document.getElementById("scoreChart").getContext("2d");
    let scoreChart;

    // Paged fetch: the rows carry big breath blobs, so the server sends 180 at
    // a time (newest first). "Load older tests" pulls the next batch.
    let profileTotal = 0;
    // win = {from, to} in unix seconds fetches an explicit range and ignores the
    // server's 90-day cap — that is how the "Older" month picker reaches history
    // the 1W/1M/3M buttons cannot see.
    async function fetchData(offset = 0, win = null) {
        let url = `${window.NODE_API}/api/dashboard/trends-history?login_id=<?php echo urlencode($login_iddata);?>&profile_id=<?php echo urlencode($profile_iddata);?>&offset=${offset}`;
        if (win) url += `&from=${win.from}&to=${win.to}`;
        const response = await fetch(url, { headers: window.authHeaders() });
        const body = await response.json();
        const data = Array.isArray(body) ? body : (body.data || []);
        if (!Array.isArray(body) && typeof body.total === "number") profileTotal = body.total;
        else profileTotal = Math.max(profileTotal, data.length);
	 return data.map((item) => ({
        time: item.dttm,
        sugar: parseFloat(item.Db_Score),
        liver: parseFloat(item.liver_score),
        respiratory: parseFloat(item.Blow_Score),
        gut: parseFloat(item.Gut_Score_per),
        acetone_ppm: item.acetone_ppm,
        h2_ppm: item.h2_ppm,
        ethanol_ppm: item.ethnol_ppm,
	fev1_l: item.FEV1_L,
	blow_raw_values: item.blow_raw_values,
        respiratory_fvc_json: item.respiratory_fvc_json,
	maxpress: item.maxpress

    }));
    }

    function createChart(labels, data, label) {
        if (scoreChart) scoreChart.destroy();

        // Give every reading fixed horizontal room; the card scrolls sideways.
        const scrollEl = document.getElementById("chartScroll");
        const innerEl = document.getElementById("chartInner");
        const PX_PER_POINT = 26;
        const plotW = Math.max(scrollEl.clientWidth, labels.length * PX_PER_POINT);
        innerEl.style.width = plotW + "px";

        const grad = ctx.createLinearGradient(0, 0, 0, 380);
        grad.addColorStop(0, "rgba(48, 139, 249, 0.16)");
        grad.addColorStop(1, "rgba(48, 139, 249, 0.01)");

        scoreChart = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label,
                    data,
                    borderColor: "#308BF9",
                    borderWidth: 2.5,
                    fill: true,
                    backgroundColor: grad,
                    tension: 0, // straight segments, exactly like the original
                    pointRadius: 2.5,
                    pointBackgroundColor: "#ffffff",
                    pointBorderColor: "#308BF9",
                    pointBorderWidth: 1.5,
                    pointHitRadius: 12,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: "#308BF9",
                    pointHoverBorderColor: "#ffffff",
                    pointHoverBorderWidth: 2,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                interaction: { mode: "nearest", axis: "x", intersect: false },
                scales: {
                    y: {
                        beginAtZero: true,
                        position: "right", // stays visible at the newest readings
                        ticks: { stepSize: 20, color: "#8c96a8", font: { size: 10, family: "Poppins" }, callback: (v) => v + "%" },
                        grid: { color: "#e9eef5", drawBorder: false },
                        border: { display: false },
                    },
                    x: {
                        ticks: {
                            autoSkip: true,
                            autoSkipPadding: 32,
                            maxRotation: 0,
                            color: "#8c96a8",
                            font: { size: 10, family: "Poppins" },
                            callback: function (value) {
                                const l = this.getLabelForValue(value) || "";
                                return String(l).split(",")[0];
                            },
                        },
                        grid: { display: false, drawBorder: false },
                        border: { display: false },
                    },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "#252525",
                        titleFont: { family: "Poppins", size: 11, weight: "600" },
                        bodyFont: { family: "Poppins", size: 11 },
                        padding: 10,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: { label: (c) => `${label}: ${c.parsed.y}%` },
                    },
                },
            },
        });

        // land on the most recent readings
        requestAnimationFrame(() => { scrollEl.scrollLeft = scrollEl.scrollWidth; });
    }

    // Mouse wheel over the chart moves the chart's timeline, not the page.
    const chartScrollEl = document.getElementById("chartScroll");
    if (chartScrollEl) {
        chartScrollEl.addEventListener(
            "wheel",
            function (e) {
                if (this.scrollWidth <= this.clientWidth) return; // nothing to scroll
                const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                if (!delta) return;
                e.preventDefault();
                this.scrollLeft += delta;
            },
            { passive: false }
        );
    }

function renderTable(dataset, scoreType) {
    const list = [...dataset];
    const table = document.getElementById("scoreTable");
    const tbody = table.querySelector("tbody");

    tbody.innerHTML = "";

    if (!list.length) {
        const hasAny = typeof profileRows !== "undefined" && profileRows.length > 0;
        // A subject can have hundreds of older tests and still be empty here,
        // because 1W/1M/3M only look back 90 days. Saying "no tests recorded"
        // in that case is simply wrong — point at the Older picker instead.
        let msg;
        if (hasAny) msg = "No tests in this range.";
        else if (allTimeTotal > 0) msg = `No tests in this range — ${allTimeTotal} older test${allTimeTotal === 1 ? "" : "s"} available under “Older”.`;
        else msg = "No tests recorded yet for this subject.";
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;vertical-align:middle;height:320px;color:#738298;font-size:12.5px;letter-spacing:-0.25px;">' + msg + '</td></tr>';
        return;
    }

    // Build every row first and write the table ONCE — appending row-by-row
    // re-parsed the whole table each time (quadratic: seconds at 180 rows).
    const rows = list.map((d, i) => {
        let gasLabel = "-";
        let gasValue = "-";
        if (scoreType === "sugar") { gasLabel = "Acetone"; gasValue = d.acetone_ppm != null ? `${d.acetone_ppm} ppm` : "NA"; }
        else if (scoreType === "gut") { gasLabel = "H\u2082"; gasValue = d.h2_ppm != null ? `${d.h2_ppm} ppm` : "NA"; }
        else if (scoreType === "liver") { gasLabel = "Ethanol"; gasValue = d.ethanol_ppm != null ? `${d.ethanol_ppm} ppm` : "NA"; }
        else if (scoreType === "respiratory") { gasLabel = "FEV1"; gasValue = d.fev1_l ? `${d.fev1_l} L` : "NA"; }

        const date = new Date(d.time);
        const formattedDate = isNaN(date.getTime())
            ? "Date unavailable"
            : `${date.getDate()} ${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()} &middot; ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).toLowerCase()}`;

        // a null score must not render as "NaN%", and a respiratory score of 0
        // means the blow test was not performed — not a severe result
        const num = parseFloat(d[scoreType]);
        const has = Number.isFinite(num) && !(scoreType === "respiratory" && num === 0);
        const status = !has ? "text-none" : num >= 80 ? "text-good" : num >= 70 ? "text-fair" : "text-poor";
        const level = !has ? "No data" : num >= 80 ? "Good" : num >= 70 ? "Fair" : "Poor";

        return `
            <tr data-idx="${i}" style="cursor: pointer;">
                <th>
                    <span class="th-date">${formattedDate}</span>
                    <div class="score">
                        <h5 class="value">${has ? num + "%" : "—"}</h5>
                        <p class="${status}">${level}</p>
                    </div>
                </th>
                <td><p>${gasLabel} : ${gasValue}</p></td>
            </tr>
        `;
    });
    tbody.innerHTML = rows.join("");

    // The report URL carries the raw breath-data blobs — encode them only for
    // the row that is actually clicked (doing it for every row up front was
    // the main reason switching score tabs felt slow).
    tbody.querySelectorAll("tr[data-idx]").forEach((tr) => {
        tr.addEventListener("click", () => openReport(list[parseInt(tr.dataset.idx, 10)]));
    });
}

function openReport(d) {
    // demographics come from window.vpSubject, fetched below with the user's
    // own token (they used to be injected by PHP via a server-side cURL)
    const s = window.vpSubject || {};
    const phpAge = s.age ?? "";
    const phpGender = s.gender ?? "";
    const phpWeight = s.weight ?? "";
    const phpHeight = s.height ?? "";
    const phpName = encodeURIComponent(VP_PARAMS.name);
    const phpLoginId = VP_PARAMS.login_id;
    const phpProfileId = VP_PARAMS.profile_id;

    // respiratory_fvc_json / maxpress / fev1_l are read by the report but never
    // used, so they are no longer sent. The breath trace goes via sessionStorage
    // (see user_report.php) because it is far too big for a URL.
    const bk = "rspblow:" + Date.now() + ":" + Math.random().toString(36).slice(2, 8);
    try { sessionStorage.setItem(bk, d.blow_raw_values ?? ""); } catch (e) { /* storage blocked */ }

    const date = new Date(d.time);
    const formattedDttm = encodeURIComponent(
        `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`
    );

    openReportModal(`./report/user_report?login_id=${phpLoginId}&profile_id=${phpProfileId}&sugar=${d.sugar}&liver=${d.liver}&resp=${d.respiratory}&guts=${d.gut}&acetone_ppm=${d.acetone_ppm ?? "NA"}&h2_ppm=${d.h2_ppm ?? "NA"}&ethnol_ppm=${d.ethanol_ppm ?? "NA"}&bk=${encodeURIComponent(bk)}&dttm=${formattedDttm}&name=${phpName}&age=${phpAge}&gender=${phpGender}&height=${phpHeight}&weight=${phpWeight}`);
}

    // ✅ Handle Tab Click
    let curRangeDays = 90;  // graph window: 7 / 30 / 90 days back from today
    let curMonth = null;    // 'YYYY-MM' while browsing an older month ("Older" picker)
    let monthsCache = null; // [{ym, n}] — months that actually contain tests
    let allTimeTotal = null; // every test this subject has ever taken

    const MONTH_NAMES = ["January","February","March","April","May","June",
                         "July","August","September","October","November","December"];
    function monthLabel(ym) {
        const [y, m] = String(ym).split("-").map(Number);
        return `${MONTH_NAMES[m - 1]} ${y}`;
    }
    // local-time month boundaries, in unix seconds
    function monthWindow(ym) {
        const [y, m] = String(ym).split("-").map(Number);
        return {
            from: Math.floor(new Date(y, m - 1, 1, 0, 0, 0).getTime() / 1000),
            to: Math.floor(new Date(y, m, 1, 0, 0, 0).getTime() / 1000) - 1,
        };
    }
    function handleTabClick(scoreType, labelName, dataset) {
        document.querySelectorAll(".btn_table_score").forEach((btn) => btn.classList.remove("active"));
        document.getElementById(`btn-${scoreType}-score`).classList.add("active");

        // The GRAPH shows only the selected range — the last 7/30/90 days
        // counted back from TODAY; the Test History list keeps the full
        // loaded window.
        // In month mode the rows ARE that month, so no further filtering.
        let chartSet;
        if (curMonth) {
            chartSet = dataset.slice();
        } else {
            const cutoff = Date.now() - curRangeDays * 86400000;
            chartSet = dataset.filter((d) => {
                const t = new Date(d.time).getTime();
                return isNaN(t) ? false : t >= cutoff;
            });
        }
        const rl = document.getElementById("graphRangeLabel");
        if (rl) {
            const win = curMonth
                ? monthLabel(curMonth)
                : "last " + (curRangeDays === 7 ? "week" : curRangeDays === 30 ? "month" : "3 months");
            rl.textContent = `${chartSet.length} test${chartSet.length === 1 ? "" : "s"} · ${win}`;
        }
        const ge = document.getElementById("graphEmpty");
        if (ge) {
            ge.style.display = chartSet.length ? "none" : "flex";
            const hint = ge.querySelector("span");
            if (hint && !chartSet.length) {
                hint.textContent = allTimeTotal > 0 && !curMonth
                    ? "This subject has older tests — use “Older” to pick a month"
                    : "Try a longer range, or check the Test History list";
            }
        }

        // Original math: EVERY test is its own point, oldest to newest,
        // evenly spaced. Only the styling differs from the old chart.
        const chrono = [...chartSet].reverse();
        const labels = chrono.map((d) => {
            const t = new Date(d.time);
            return isNaN(t.getTime())
                ? String(d.time)
                : t.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
                  ", " + t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase();
        });
        const data = chrono.map((d) => parseFloat(d[scoreType]));
        createChart(labels, data, labelName);
        // one range drives BOTH sides: the history list shows the same window
        window.__histShown = chartSet.length;
        renderTable(chartSet, scoreType);
    }

    // ✅ Init on Page Load — rows accumulate as older pages are loaded
    let profileRows = [];
    let curScoreType = "sugar";
    let curScoreLabel = "Sugar Score";

    function showTab(scoreType, labelName) {
        curScoreType = scoreType;
        curScoreLabel = labelName;
        handleTabClick(scoreType, labelName, profileRows);
        updateHistoryFoot();
    }

    function updateHistoryFoot() {
        const foot = document.getElementById("historyFootVP");
        const txt = document.getElementById("historyFootText");
        const btn = document.getElementById("loadOlderBtn");
        if (!foot) return;
        const shown = window.__histShown ?? profileRows.length;
        const win = curMonth
            ? monthLabel(curMonth)
            : (curRangeDays === 7 ? "last week" : curRangeDays === 30 ? "last month" : "last 3 months");
        foot.style.display = profileRows.length ? "flex" : "none";
        if (txt) txt.textContent = `${shown} test${shown === 1 ? "" : "s"} · ${win}`;
        // older batches only make sense in the full 3-month view or inside a month
        const more = (curMonth || curRangeDays === 90) && profileRows.length < profileTotal;
        if (btn) btn.style.display = more ? "" : "none";
    }

    document.addEventListener("DOMContentLoaded", async () => {
        profileRows = await fetchData(0);

        // Open on the NARROWEST range that actually contains tests: 1W if the
        // last week has any, else 1M, else 3M. Always defaulting to 3M meant a
        // subject who tested yesterday still opened on a 3-month view.
        (function pickInitialRange() {
            const now = Date.now();
            const hasWithin = (days) => profileRows.some((d) => {
                const ts = new Date(d.time).getTime();
                return !isNaN(ts) && ts >= now - days * 86400000;
            });
            curRangeDays = hasWithin(7) ? 7 : hasWithin(30) ? 30 : 90;
            document.querySelectorAll("#graphRangeSeg button[data-days]").forEach((x) =>
                x.classList.toggle("on", x.dataset.days === String(curRangeDays))
            );
        })();

        showTab("sugar", "Sugar Score");

        // cheap, and it lets the empty states say something true
        loadMonths()
            .then(() => {
                allTimeTotal = (monthsCache || []).reduce((sum, m) => sum + Number(m.n || 0), 0);
                if (!profileRows.length) showTab(curScoreType, curScoreLabel); // refresh the wording
            })
            .catch(() => { /* picker will report its own failure */ });
        document.getElementById("btn-sugar-score").addEventListener("click", () => showTab("sugar", "Sugar Score"));
        document.getElementById("btn-liver-score").addEventListener("click", () => showTab("liver", "Liver Score"));
        document.getElementById("btn-respiratory-score").addEventListener("click", () => showTab("respiratory", "Respiratory Score"));
        document.getElementById("btn-gut-score").addEventListener("click", () => showTab("gut", "Gut Score"));

        const monthPick = document.getElementById("monthPick");
        const monthList = document.getElementById("monthPickList");
        const btnOlder = document.getElementById("btnOlder");
        const OLDER_LABEL = 'Older <i class="fa-solid fa-chevron-down"></i>';

        function markActive(el) {
            document.querySelectorAll("#graphRangeSeg button").forEach((x) => x.classList.toggle("on", x === el));
        }

        // 1W / 1M / 3M — back to the rolling window from today
        document.querySelectorAll("#graphRangeSeg button[data-days]:not(#btnOlder)").forEach((b) =>
            b.addEventListener("click", async () => {
                markActive(b);
                if (monthPick) monthPick.hidden = true;
                const wasMonth = curMonth;
                curMonth = null;
                // the Older button carries the chosen month as its label, so
                // reset it when the user moves back to a rolling range
                if (btnOlder) btnOlder.innerHTML = OLDER_LABEL;
                curRangeDays = parseInt(b.dataset.days, 10) || 30;
                // leaving month mode means the loaded rows are the wrong set
                if (wasMonth) {
                    profileRows = await fetchData(0);
                }
                showTab(curScoreType, curScoreLabel);
            })
        );

        // "Older" — list the months that actually contain tests
        async function loadMonths() {
            if (monthsCache) return monthsCache;
            const url = `${window.NODE_API}/api/dashboard/profile-months?login_id=<?php echo urlencode($login_iddata);?>&profile_id=<?php echo urlencode($profile_iddata);?>`;
            const r = await fetch(url, { headers: window.authHeaders() });
            if (!r.ok) throw new Error("HTTP " + r.status);
            const body = await r.json();
            monthsCache = Array.isArray(body.months) ? body.months : [];
            return monthsCache;
        }

        function renderMonths(months) {
            if (!monthList) return;
            if (!months.length) {
                monthList.innerHTML = '<p class="vp-monthpick-empty">No tests recorded yet.</p>';
                return;
            }
            monthList.innerHTML = months
                .map((m) => `<button type="button" class="vp-monthitem${m.ym === curMonth ? " on" : ""}" data-ym="${m.ym}">
                        <span>${monthLabel(m.ym)}</span><b>${m.n}</b>
                    </button>`)
                .join("");
            monthList.querySelectorAll(".vp-monthitem").forEach((btn) =>
                btn.addEventListener("click", async () => {
                    const ym = btn.dataset.ym;
                    monthPick.hidden = true;
                    markActive(btnOlder);
                    btnOlder.innerHTML = monthLabel(ym) + ' <i class="fa-solid fa-chevron-down"></i>';
                    curMonth = ym;
                    profileRows = await fetchData(0, monthWindow(ym));
                    showTab(curScoreType, curScoreLabel);
                })
            );
        }

        if (btnOlder) {
            btnOlder.addEventListener("click", async (e) => {
                e.stopPropagation();
                if (!monthPick.hidden) { monthPick.hidden = true; return; }
                monthPick.hidden = false;
                try {
                    renderMonths(await loadMonths());
                } catch (err) {
                    monthList.innerHTML = '<p class="vp-monthpick-empty">Could not load months.</p>';
                    console.warn("profile-months:", err.message);
                }
            });
            // click-away and Esc close the panel
            document.addEventListener("click", (e) => {
                if (!monthPick.hidden && !monthPick.contains(e.target) && e.target !== btnOlder) monthPick.hidden = true;
            });
            document.addEventListener("keydown", (e) => { if (e.key === "Escape") monthPick.hidden = true; });
        }

        const olderBtn = document.getElementById("loadOlderBtn");
        if (olderBtn) olderBtn.addEventListener("click", async () => {
            olderBtn.disabled = true;
            olderBtn.textContent = "Loading…";
            try {
                const older = await fetchData(profileRows.length, curMonth ? monthWindow(curMonth) : null);
                profileRows = profileRows.concat(older); // newest-first + next-older batch
                showTab(curScoreType, curScoreLabel);
            } catch (e) {
                console.warn("load older", e);
            }
            olderBtn.disabled = false;
            olderBtn.textContent = "Load older tests";
        });
    });
</script>

<script>
    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll(".clickable-row").forEach((row) => {
            row.addEventListener("click", function () {
                const url = this.dataset.href;
                window.location.href = url;
            });
        });
    });
</script>
