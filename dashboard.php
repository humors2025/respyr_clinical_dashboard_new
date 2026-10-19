<!DOCTYPE html>
<html lang="en">
     <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
     <?php include "head.php"; ?>

     <style>



.custom-toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      min-width: 300px;
      max-width: 400px;
      background-color: #f5f5f5;
      border: 1px solid #ccc;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      padding: 15px;
      z-index: 9999;
      display: none;
      border-left: 5px solid #3498db;
    }

    .toast-header {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
    }

    .toast-title-success { color: #2ecc71; }
    .toast-title-danger  { color: #e74c3c; }
    .toast-title-warning { color: #f39c12; }
    .toast-title-purple  { color: #8e44ad; }
    .toast-title-primary { color: #308BF9; }

    .toast-body {
      margin-top: 8px;
    }



.new-dashboard .card-emp-test-analysis .complete-wrapper .test-log-wrapper .header{
padding:0px;
display:flex;
justify-content:space-between;
margin-top:10px;
}


.new-dashboard .card-emp-test-analysis .complete-wrapper .test-log-wrapper table{

margin-top:20px;
}



.score .value {
  min-width: 60px;
  text-align: left;
  font-weight: 600;
}


.clickable-row {
    cursor: pointer;
    transition: background 0.2s;
}
.clickable-row:hover {
    background-color: #f5f5f5;
}




          .pie-chart-container {
               max-width: 100%;
               height: 200px;
               position: relative;
	       display:flex;
	       justify-content:center;
          }

          .pie-chart-container canvas {
               width: 100%;
               height: 100%;
          }

          #donutCenterText {
               position: absolute;
               top: 50%;
               left: 50%;
               transform: translate(-50%, -50%);
               text-align: center;
               font-size: 12px;
               font-weight: 500;
               line-height: 1.2;
               pointer-events: none;
               z-index: 10;
          }
          #donutCenterText p {
               color: #5b5b5b;
               text-align: center;
               font-family: Poppins;
               font-size: 12px;
               font-style: normal;
               font-weight: 400;
               line-height: normal;
               letter-spacing: -0.24px;
               margin: 0;
          }
          #donutCenterText h2 {
               color: #5b5b5b;
               text-align: center;
               font-family: Poppins;
               font-size: 30px;
               font-style: normal;
               font-weight: 600;
               line-height: normal;
               letter-spacing: -0.6px;
               margin: 10px 0 0 0;
          }
          #donutCenterText small {
               color: #5b5b5b;
               text-align: center;
               font-family: Poppins;
               font-size: 12px;
               font-style: normal;
               font-weight: 400;
               line-height: 110%; /* 13.2px */
               letter-spacing: -0.24px;
          }

          .card-dropdown-wrapper {
               margin-bottom: 20px;
          }


      .gender-chart-container {
          width: 100%;
          max-height: 300px;
     }
     .gender-chart-container #ageGenderChart {
          width: 100% !important;
          height: auto  !important;
     }
     #scoreTypeSelector, #scoreRangeSelector{
          border-radius: 10px;
          border: 1px solid #C7C6CE;
          background: #fff;
          padding:10px 27px;
          color: #535359;
          text-align: center;
          font-family: Poppins;
          font-size: 15px;
          font-style: normal;
          font-weight: 500;
          line-height: normal;
          letter-spacing: -0.3px;
     }



    .chart-test-taken {
        width: 100%;
        max-width: 100%;
    }
    .chart-test-taken canvas {
        width: auto !important;
	max-width: 100% !important;
     	 height: 150px !important;
        max-height: 150px !important;
    }
    .chart-test-taken-container .header{
        padding:0px;
        background-color: #0000;
        display:flex;
        gap:8px;
  position: static; /* or relative */
    
}
    .chart-test-taken-container .header h3{
        color: #5B5B5B;
        font-family: Poppins;
        font-size: 15px;
        font-style: normal;
        font-weight: 400;
        line-height: normal;
        letter-spacing: -0.6px;
    }
    .chart-test-taken-container .header #rangeSelector{
            border: none;
            background-color: #0000;
            color: #535359;
            text-align: center;
            font-family: Poppins;
            font-size: 12px;
            font-style: normal;
            font-weight: 500;
            line-height: normal;
            letter-spacing: -0.24px;
    }



    .total-test-taken {
        flex: 1;
    }

    .new-dashboard .card-emp-data {
        border-radius: 20px;
        background: #f5f7fa;
    }

    .new-dashboard .card-emp-data .card-emp-data-01 {
        border-radius: 20px;
        background: #fff;
    }

    .total-test-taken {
        padding: 19px 49px 19px 23px;
    }

    .test-taken {
        display: flex;
        align-items: center;
        margin-top: 19px;
    }

    .test-taken .value {
        color: #252525;
        font-family: Poppins;
        font-size: 30px;
        font-style: normal;
        font-weight: 400;
        line-height: normal;
        letter-spacing: -0.6px;
    }
    .test-taken #totalTest {
        color: #252525;
        font-family: Poppins;
        font-size: 15px;
        font-style: normal;
        font-weight: 400;
        line-height: normal;
        letter-spacing: -0.3px;
    }

    .total-test-taken .title {
        color: #252525;
        font-family: Poppins;
        font-size: 15px;
        font-style: normal;
        font-weight: 400;
        line-height: 110%; /* 16.5px */
        letter-spacing: -0.3px;
    }

    progress {
        width: 100%;
        height: 10px;
        border: none;
        border-radius: 10px;
        overflow: hidden;
    }

    /* Chrome, Safari */
    progress::-webkit-progress-bar {
        background-color: #fff;
    }

    progress.red-bar::-webkit-progress-value {
        background-color: red;
    }

    /* Firefox */
    progress.green-bar::-moz-progress-bar {
        background-color: #4caf50;
    }

    progress.red-bar {
        background-color: #ea5455;
    }


.new-dashboard .card-emp-test-analysis .complete-wrapper .test-log-wrapper table .score-cell{
    display: flex;
    flex-direction: column;
    justify-content: end;
    align-items: end;
}




     </style>


<!-- Make sure this is placed BEFORE any other scripts that use login_id -->
<script>
// ✅ Global loginId seeding and accessor
(function(){
  // Decode JWT payload manually (no external library needed)
  function decodeJwtPayload(token) {
    try {
      let payload = token.split('.')[1];
      payload = payload.replace(/-/g, '+').replace(/_/g, '/');
      while (payload.length % 4) payload += '=';
      return JSON.parse(atob(payload));
    } catch (e) {
      console.warn("JWT decode failed:", e);
      return null;
    }
  }

  // Seed login_id from token
  const token = localStorage.getItem("jwt_token");
  if (token) {
    const decoded = decodeJwtPayload(token);
    if (decoded && decoded.login_id) {
      localStorage.setItem("login_id", decoded.login_id);
      // console.log("🔑 Seeded login_id:", decoded.login_id);
    } else {
      console.warn("No login_id found in token");
    }
  } else {
    console.warn("No jwt_token found in localStorage");
  }

  // Universal accessor
  window.getLoginId = function(){
    return localStorage.getItem("login_id") || "";
  };

  // Optional global constant for quick reuse (snapshot of current value)
  window.loginId = window.getLoginId();
  //console.log("🔑 Global loginId:", window.loginId);

})();
</script>


     <body class="rsp2-fit">



          <?php include "./pages/sidebar.php" ?>
          <main class="main-wrapper">
               <?php include "pages/header.php" ?>

               <section class="section new-dashboard">
                    <div class="container-fluid">

                         <!-- ================= KPI STRIP ================= -->
                         <div class="rsp2-kpis">
                              <div class="rsp-card rsp2-kpi">
                                   <p class="rsp-kpi-label">Subjects tested</p>
                                   <h2 class="rsp-kpi-value" id="dataCount">0</h2>
                                   <p class="rsp2-kpi-sub">on <span id="rspChipDay"><?php date_default_timezone_set('Asia/Kolkata'); echo date('d'); ?></span> <span id="rspChipMon"><?php echo date('M'); ?></span></p>
                              </div>
                              <div class="rsp-card rsp2-kpi">
                                   <p class="rsp-kpi-label">Tests this day</p>
                                   <h2 class="rsp-kpi-value" id="testsThisDay">0</h2>
                                   <p class="rsp2-kpi-sub">breath tests recorded</p>
                              </div>
                              <div class="rsp-card rsp2-kpi">
                                   <p class="rsp-kpi-label">Subjects onboarded</p>
                                   <h2 class="rsp-kpi-value"><span id="emponboard">0</span></h2>
                                   <p class="rsp2-kpi-sub">all time</p>
                              </div>
                              <div class="rsp-card rsp2-kpi rsp2-kpi--gauge">
                                   <svg class="rsp2-gauge" viewBox="0 0 48 48" aria-hidden="true">
                                        <circle class="track" cx="24" cy="24" r="20" fill="none" stroke-width="5.5"/>
                                        <circle class="fill" id="gaugeFill" cx="24" cy="24" r="20" fill="none" stroke-width="5.5" stroke-dasharray="0 125.66" transform="rotate(-90 24 24)"/>
                                        <text id="gaugePct" x="24" y="28" text-anchor="middle">&ndash;</text>
                                   </svg>
                                   <div class="rsp2-kpi-body">
                                        <p class="rsp-kpi-label">Tests used</p>
                                        <h2 class="rsp-kpi-value rsp2-gaugeval"><span id="testTaken">0</span><span class="rsp-kpi-frac" id="totalTest"></span></h2>
                                        <p class="rsp2-kpi-sub">of your clinic's plan</p>
                                   </div>
                              </div>
                         </div>

                         <!-- ================= ANALYSIS ROW ================= -->
                         <div class="rsp2-main">

                              <!-- Scores & test log: one filter drives both -->
                              <section class="rsp-card rsp2-combo">
                                   <div class="rsp-kpi-top">
                                        <p class="rsp-kpi-label">Scores &amp; test log <span class="rsp-kpi-ctx" id="comboCtx">&middot; selected day</span></p>
                                        <div class="rsp2-headtools">
                                             <div class="rsp2-seg" id="scoreSeg">
                                                  <button type="button" class="on" data-score="Db_Score" data-label="Sugar">Sugar</button>
                                                  <button type="button" data-score="liver_score" data-label="Liver">Liver</button>
                                                  <button type="button" data-score="Blow_Score" data-label="Respiratory">Respiratory</button>
                                                  <button type="button" data-score="Gut_Score_per" data-label="Gut">Gut</button>
                                             </div>
                                             <!-- test log search: icon only until clicked -->
                                             <div class="rsp2-logsearch" id="logSearch">
                                                  <button type="button" class="rsp2-searchbtn" id="logSearchBtn" aria-label="Search this day's tests" data-tip="Search this day's tests">
                                                       <i class="fa-solid fa-magnifying-glass"></i>
                                                  </button>
                                                  <input type="text" id="logSearchInput" placeholder="Search a name&hellip;" autocomplete="off" />
                                                  <button type="button" class="rsp2-searchclose" id="logSearchClose" aria-label="Close search">
                                                       <i class="fa-solid fa-xmark"></i>
                                                  </button>
                                             </div>
                                             <a class="rsp-link" href="./history.php">See more</a>
                                        </div>
                                   </div>
                                   <div class="rsp2-combobody">
                                        <div class="rsp2-donutside">
                                             <div class="pie-chart-container">
                                                  <div id="donutCenterText">
                                                       <p>&mdash;</p>
                                                       <h2>0</h2>
                                                       <small>subjects <br /> tested</small>
                                                  </div>
                                                  <canvas id="donutChart"></canvas>
                                             </div>
                                             <div class="rsp-legend rsp2-legend">
                                                  <span><i class="rsp-dot" style="background:#3faf58"></i>Good <b id="legGood">0</b></span>
                                                  <span><i class="rsp-dot" style="background:#ffbf2d"></i>Fair <b id="legFair">0</b></span>
                                                  <span><i class="rsp-dot" style="background:#e74c3c"></i>Poor <b id="legPoor">0</b></span>
                                             </div>
                                        </div>
                                        <div class="rsp2-logside">
                                             <div class="rsp2-loglist" id="dayLog"></div>
                                             <div class="rsp2-logfoot" id="dayLogFoot"></div>
                                        </div>
                                   </div>
                              </section>

                              <!-- Right column: trend + demographics -->
                              <div class="rsp2-right">
                                   <section class="rsp-card rsp2-trendcard">
                                        <div class="rsp-kpi-top">
                                             <p class="rsp-kpi-label">Tests trend</p>
                                             <div class="rsp2-seg rsp2-seg-sm" id="rangeSeg">
                                                  <button type="button" class="on" data-days="7">7d</button>
                                                  <button type="button" data-days="30">30d</button>
                                             </div>
                                        </div>
                                        <div class="rsp2-wk">
                                             <div class="rsp2-wkstat">
                                                  <div class="n" id="trendTotal">0</div>
                                                  <div class="l" id="trendTotalSuffix">tests</div>
                                             </div>
                                             <div class="rsp2-wkchart">
                                                  <div class="rsp2-wkbars" id="trendBars"></div>
                                                  <div class="rsp2-wkdays" id="trendDays"></div>
                                             </div>
                                        </div>
                                   </section>
                                   <section class="rsp-card rsp2-gendercard">
                                        <div class="rsp-kpi-top rsp2-gahead">
                                             <p class="rsp-kpi-label">Gender &amp; age</p>
                                             <div class="rsp2-gaselwrap">
                                                  <div class="rsp2-dd" data-for="scoreTypeSelector">
                                                       <button type="button" class="rsp2-ddbtn"><span class="lbl"><span class="txt">Sugar</span></span><i class="fa-solid fa-chevron-down chev"></i></button>
                                                       <div class="rsp2-ddmenu">
                                                            <button type="button" class="on" data-value="Db_Score"><span class="txt">Sugar</span><i class="fa-solid fa-check"></i></button>
                                                            <button type="button" data-value="liver_score"><span class="txt">Liver</span><i class="fa-solid fa-check"></i></button>
                                                            <button type="button" data-value="Gut_Score_per"><span class="txt">Gut</span><i class="fa-solid fa-check"></i></button>
                                                            <button type="button" data-value="Blow_Score"><span class="txt">Respiratory</span><i class="fa-solid fa-check"></i></button>
                                                       </div>
                                                  </div>
                                                  <div class="rsp2-dd" data-for="scoreRangeSelector">
                                                       <button type="button" class="rsp2-ddbtn"><span class="lbl"><span class="dot" style="background:#3faf58"></span><span class="txt">Good</span></span><i class="fa-solid fa-chevron-down chev"></i></button>
                                                       <div class="rsp2-ddmenu">
                                                            <button type="button" class="on" data-value="good"><span class="dot" style="background:#3faf58"></span><span class="txt">Good</span><i class="fa-solid fa-check"></i></button>
                                                            <button type="button" data-value="fair"><span class="dot" style="background:#ffbf2d"></span><span class="txt">Fair</span><i class="fa-solid fa-check"></i></button>
                                                            <button type="button" data-value="poor"><span class="dot" style="background:#e74c3c"></span><span class="txt">Poor</span><i class="fa-solid fa-check"></i></button>
                                                       </div>
                                                  </div>
                                             </div>
                                             <!-- hidden state the pipeline reads -->
                                             <select id="scoreTypeSelector" hidden>
                                                  <option value="Db_Score" selected>Sugar</option>
                                                  <option value="liver_score">Liver</option>
                                                  <option value="Gut_Score_per">Gut</option>
                                                  <option value="Blow_Score">Respiratory</option>
                                             </select>
                                             <select id="scoreRangeSelector" hidden>
                                                  <option value="good" selected>Good</option>
                                                  <option value="fair">Fair</option>
                                                  <option value="poor">Poor</option>
                                             </select>
                                        </div>
                                        <div class="rsp2-gachips" id="gaChips"></div>
                                        <div class="rsp2-garows" id="gaRows">
                                             <div class="rsp-empty" id="genderEmpty" style="display:none">
                                                  <strong>No data for this day</strong>
                                                  <span>Fills in once subjects take tests</span>
                                             </div>
                                        </div>
                                   </section>
                              </div>
                         </div>

                         <!-- hidden legacy control the data pipeline still reads -->
                         <select id="rangeSelector" hidden><option value="7" selected>7</option><option value="30">30</option></select>

                    </div>
               </section>
               <script>
               /* Keep the KPI date chip in sync with the header date picker */
               (function () {
                    var el = document.getElementById('dateInput');
                    if (!el) return;
                    var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                    el.addEventListener('changeDate', function () {
                         try {
                              var p = (el.value || '').split('-'); // dd-mm-yyyy
                              if (p.length === 3) {
                                   document.getElementById('rspChipDay').textContent = p[0];
                                   document.getElementById('rspChipMon').textContent = MON[parseInt(p[1], 10) - 1] || '';
                              }
                         } catch (e) {}
                    });
               })();
               </script>
               <?php include "footer.php"; ?>
          </main>
          <script src="assets/js/bootstrap.bundle.min.js"></script>
          <script>
               // Global chart styling (brand type + softer axes + rounded bars).
               // A second copy of Chart.js loads from a CDN further down and
               // REPLACES window.Chart, so re-apply once everything has loaded.
               function applyRespyrChartDefaults() {
                    if (!window.Chart || !Chart.defaults) return;

                    Chart.defaults.font.family = "'Poppins', sans-serif";
                    Chart.defaults.font.size = 11;
                    Chart.defaults.color = "#8ea0b5";
                    if (Chart.defaults.elements && Chart.defaults.elements.bar) {
                         Chart.defaults.elements.bar.borderRadius = 7;
                    }
                    const tt = Chart.defaults.plugins && Chart.defaults.plugins.tooltip;
                    if (tt) {
                         tt.backgroundColor = "#252525";
                         tt.padding = 10;
                         tt.cornerRadius = 8;
                         tt.displayColors = false;
                    }
               }
               applyRespyrChartDefaults();
               document.addEventListener("DOMContentLoaded", applyRespyrChartDefaults);

               // One request per (clinic, day) for the age-gender-diversity rows.
               // The donut, the gender chart and the test log all consume the same
               // data — before this they fired three identical POSTs per date change.
               window.__dayRowsCache = {};
               window.__dayEpoch = 0; // bumped per day change; stale responses are dropped
               window.fetchDayRows = function (loginId, date) {
                    const key = `${loginId}|${date}`;
                    if (!window.__dayRowsCache[key]) {
                         window.__dayRowsCache[key] = fetch(`${window.NODE_API}/api/dashboard/age-gender-diversity`, {
                              method: "POST",
                              headers: window.authHeaders({ "Content-Type": "application/x-www-form-urlencoded" }),
                              body: new URLSearchParams({ login_id: loginId, date: date }),
                         }).then((r) => {
                              // fetch does NOT reject on 4xx/5xx, so without this an
                              // expired-token error object was cached for that day
                              // for the life of the page.
                              if (!r.ok) throw new Error(`HTTP ${r.status}`);
                              return r.json();
                         }).catch((err) => {
                              delete window.__dayRowsCache[key]; // don't cache failures
                              throw err;
                         });
                    }
                    return window.__dayRowsCache[key];
               };

               // Subject names come from the mobile app, so they are untrusted:
               // escape anything built into innerHTML.
               window.rspEsc = function (v) {
                    return String(v ?? "").replace(/[&<>"']/g, (c) =>
                         ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
               };

               // Does this row have a real score for this metric?
               // Sugar/liver/gut are never 0 anywhere in the table, but the
               // respiratory score is stored as 0 when the blow test was not
               // performed — showing that as a red 0% made a skipped test look
               // like a severe clinical result.
               window.rspHasScore = function (key, raw) {
                    const n = parseFloat(raw);
                    if (!Number.isFinite(n)) return false;
                    const isResp = key === "Blow_Score" || key === "respiratory";
                    return !(isResp && n === 0);
               };
          </script>
          <script src="assets/js/dynamic-pie-chart.js"></script>
          <script src="assets/js/moment.min.js"></script>
          <script src="assets/js/fullcalendar.js"></script>
          <script src="assets/js/jvectormap.min.js"></script>
          <script src="assets/js/world-merc.js"></script>
          <script src="assets/js/polyfill.js"></script>
          <script src="assets/js/main.js"></script>
          <script src="https://code.jquery.com/jquery-3.7.1.js"></script>
          <script src="https://cdn.datatables.net/2.3.0/js/dataTables.js"></script>




  <div id="customToast" class="custom-toast">
    <div class="toast-header">
      <span id="toastTitle">Notification</span>
      <span id="toastTime">just now</span>
    </div>
    <div class="toast-body" id="toastBody">Placeholder message</div>
  </div>

  <!-- Firebase SDK -->
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js"></script>



<script>
let selectedFormattedDate = ''; // Global variable to hold formatted date
</script>

 <script>
    // Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyABi91FzBJnma4vF_EyRVx73K2AS_kO_PI",
      authDomain: "resyrdashboard.firebaseapp.com",
      projectId: "resyrdashboard",
      storageBucket: "resyrdashboard.firebasestorage.app",
      messagingSenderId: "167675800197",
      appId: "1:167675800197:web:431cac669bcb337e9917ec",
      measurementId: "G-MZ828MJBBV",
      databaseURL: "https://resyrdashboard-default-rtdb.firebaseio.com"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    const logRef = db.ref("logs");

    // DOM Elements
    const toastEl = document.getElementById('customToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastTime = document.getElementById('toastTime');
    const toastBody = document.getElementById('toastBody');

    // State
    const pageLoadTime = Math.floor(Date.now() / 1000);
    const selectedLoginId = localStorage.getItem("login_id");
    const activeTestToasts = new Set();

    // Helpers
    function formatCategory(cat) {
      return (cat || '').replace(/_/g, ' ').toUpperCase();
    }

    function getTitleColorClass(category) {
      switch (category) {
        case 'profile_created':  return 'toast-title-success';
        case 'profile_removed':  return 'toast-title-danger';
        case 'test_started':     return 'toast-title-warning';
        case 'test_completed':   return 'toast-title-purple';
        default:                 return 'toast-title-primary';
      }
    }

    // Toast Display Logic
    function showToast(category, name) {
      const titleText = formatCategory(category);
      const time = new Date().toLocaleTimeString();
      const message = `${titleText} for ${name || 'Unknown'}`;

      toastTitle.textContent = titleText;
      toastTime.textContent = time;
      toastBody.textContent = message;
      toastTitle.className = getTitleColorClass(category);
      toastEl.style.display = 'block';

      if (category === 'test_started') {
        activeTestToasts.add(name);
        // DO NOT hide toast automatically
        return;

      } else if (category === 'test_completed') {
        if (activeTestToasts.has(name)) {
          // Hide existing test_started toast
          toastEl.style.display = 'none';
          activeTestToasts.delete(name);

          // Show TEST COMPLETED after delay
          setTimeout(() => {
            toastTitle.textContent = "TEST COMPLETED";
            toastTime.textContent = new Date().toLocaleTimeString();
            toastBody.textContent = `TEST COMPLETED for ${name || 'Unknown'}`;
            toastTitle.className = 'toast-title-purple';
            toastEl.style.display = 'block';

            setTimeout(() => {
              toastEl.style.display = 'none';
            }, 3000);
          }, 300);
        }

      } else {
        // All other categories show for 3 seconds
        setTimeout(() => {
          toastEl.style.display = 'none';
        }, 3000);
      }
    }

    // ---------------------------------------------------------------------
    // Live refresh.
    //
    // The toast used to be the ONLY sign that something happened — every card
    // kept showing stale numbers until the page was reloaded. Now a completed
    // test pulls the new rows in and repaints.
    //
    // It tops up rather than re-downloading: /data-weeks takes a `from`, so we
    // ask only for rows since the last refresh (the full history is ~1.4 MB and
    // re-fetching it per test would be wasteful). Several tests finishing at
    // once collapse into one refresh.
    // ---------------------------------------------------------------------
    let rspRefreshTimer = null;
    let rspLastSync = pageLoadTime;

    async function rspLiveRefresh() {
      try {
        const since = Math.max(0, rspLastSync - 120); // small overlap for clock skew
        const res = await fetch(`${window.NODE_API}/api/dashboard/data-weeks`, {
          method: "POST",
          headers: window.authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ login_id: selectedLoginId, from: since }),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const fresh = await res.json();
        if (!Array.isArray(fresh) || !fresh.length) return;

        // merge by test id so a re-sent row never duplicates
        const byId = new Map((window.weeksData || []).map((r) => [String(r.id), r]));
        fresh.forEach((r) => byId.set(String(r.id), r));
        window.weeksData = Array.from(byId.values());
        rspLastSync = Math.floor(Date.now() / 1000);

        // the donut/gender cards read a per-day cache — drop it so they refetch
        window.__dayRowsCache = {};
        window.__dayEpoch = (window.__dayEpoch || 0) + 1;

        if (window.updateDayWidgets) updateDayWidgets();
        if (typeof renderDonutChart === "function") renderDonutChart()?.catch?.(() => {});
        if (typeof renderAgeGenderChart === "function") renderAgeGenderChart()?.catch?.(() => {});
        if (typeof renderChart === "function") {
          const sel = document.getElementById("rangeSelector");
          renderChart(window.weeksData, parseInt(sel && sel.value, 10) || 7);
        }
      } catch (err) {
        console.warn("live refresh:", err.message);
      }
    }

    function rspScheduleRefresh() {
      clearTimeout(rspRefreshTimer);
      rspRefreshTimer = setTimeout(rspLiveRefresh, 2000); // let a burst settle
    }

    // Firebase listener
    logRef.limitToLast(20).on("child_added", (snapshot) => {
      const data = snapshot.val();
      const logTime = data.timestamp || 0;

      if (logTime > pageLoadTime && data.login_id === selectedLoginId) {
        showToast(data.category, data.name);
        // a finished test (or a subject added/removed) changes what the cards show
        if (["test_completed", "profile_created", "profile_removed"].includes(data.category)) {
          rspScheduleRefresh();
        }
      }
    });
  </script>



     </body>
</html>
<script src="https://cdn.jsdelivr.net/npm/jwt-decode@3/build/jwt-decode.min.js"></script>



<script src="https://cdn.jsdelivr.net/npm/vanillajs-datepicker@1.3.4/dist/js/datepicker-full.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vanillajs-datepicker@1.3.4/dist/css/datepicker-bs5.min.css">














<script>
 function logout() {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("login_id");
    sessionStorage.clear();
    window.location.href = "./clinical-v2/";


  }

     function checkTokenAndRender() {
          const token = localStorage.getItem("jwt_token");

          try {
               if (!token) throw new Error("no token (local dev)");
               const decoded = jwt_decode(token);
               const now = Math.floor(Date.now() / 1000);

               if (decoded.exp < now) throw new Error("Token expired");

               // ✅ Show username or login_id
               document.getElementById("welcome2").textContent = `Welcome, ${decoded.username || decoded.login_id}!`;
	//	localStorage.setItem("login_id", ${decoded.username});
		localStorage.setItem("login_id", decoded.username || decoded.login_id);


               // ✅ Fetch and display data
               fetch(`${window.NODE_API}/api/dashboard/data-weeks`, {
                    method: "POST",
                    headers: window.authHeaders({ "Content-Type": "application/json" }),
                    body: JSON.stringify({ login_id: decoded.username || decoded.login_id }),
               })
                    .then((res) => res.json())
                    .then((data) => {
                         // ✅ Count records
                         const count = Array.isArray(data) ? data.length : 0;
                       //  document.getElementById("dataCount").textContent = count;

                         // ✅ Render chart
                         window.weeksData = data;
                         renderChart(data, 7); // default 7 days
                         if (window.updateDayWidgets) updateDayWidgets();

                         // ✅ Dropdown change
                         document.getElementById("rangeSelector").addEventListener("change", function () {
                              renderChart(data, parseInt(this.value));
                         });
                    })
                    .catch((err) => {
                         console.warn("API fetch failed:", err.message);
                         document.getElementById("dataCount").textContent = "Error";
                    });
          } catch (err) {
               // LOCAL DEV: render with the stored login_id (OFFC) instead of
               // redirecting to login, so the dashboard always shows.
               // No valid session — back to the login portal.
               console.warn("Token issue:", err.message);
               localStorage.removeItem("jwt_token");
               window.location.href = "./clinical-v2/";
          }
     }

     function renderChart(data, days) {
          // The window ENDS on the day picked in the header (falls back to today),
          // so the trend always matches the rest of the dashboard.
          let end = new Date();
          if (typeof selectedFormattedDate === "string" && selectedFormattedDate) {
               const p = selectedFormattedDate.split("/"); // dd/mm/yyyy
               if (p.length === 3) end = new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
          }
          end.setHours(23, 59, 59, 999);
          const endTs = Math.floor(end.getTime() / 1000);
          const startTs = endTs - days * 24 * 60 * 60;

          // One bucket per day (zero days included) so the axis is a real timeline.
          const dailyCount = {};
          const labels = [];
          for (let i = days - 1; i >= 0; i--) {
               const d = new Date(end.getTime() - i * 24 * 60 * 60 * 1000);
               const label = `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
               labels.push(label);
               dailyCount[label] = 0;
          }
          data.forEach((item) => {
               const ts = parseInt(item.timestamp, 10);
               if (ts > startTs && ts <= endTs) {
                    const date = new Date(ts * 1000);
                    const label = `${date.getDate()} ${date.toLocaleString("default", { month: "short" })}`;
                    if (label in dailyCount) dailyCount[label]++;
               }
          });

          const values = labels.map((l) => dailyCount[l]);

          // Header total mirrors the KPI cards: hero number + muted context.
          const totalEl = document.getElementById("trendTotal");
          if (totalEl) totalEl.textContent = values.reduce((a, b) => a + b, 0).toLocaleString("en-IN");
          const sufEl = document.getElementById("trendTotalSuffix");
          if (sufEl) sufEl.textContent = `tests in the last ${days} days`;

          // Screen-time-style mini bars: zero days are quiet grey ticks, the
          // busiest day carries a count label, every bar has a title tooltip.
          const barsEl = document.getElementById("trendBars");
          const daysEl = document.getElementById("trendDays");
          if (barsEl && daysEl) {
               const max = Math.max(...values, 0);
               barsEl.style.gridTemplateColumns = `repeat(${values.length}, 1fr)`;
               daysEl.style.gridTemplateColumns = `repeat(${values.length}, 1fr)`;
               // data-tt, NOT data-tip: the polish CSS has a global [data-tip]
               // hover tooltip (action buttons) that must not fire here.
               // Zero days carry no attribute — no tooltip, no highlight.
               barsEl.innerHTML = values.map((v, i) => {
                    if (!v) return `<div class="rsp2-wb z"></div>`;
                    const t = `${v} test${v === 1 ? "" : "s"}`;
                    const h = Math.max(16, Math.round((v / max) * 82));
                    return `<div class="rsp2-wb" style="height:${h}%" data-tt="${t}"></div>`;
               }).join("");
               daysEl.innerHTML = labels.map((l, i) => {
                    const sparse = values.length > 14 && i % 5 !== 0 && i !== values.length - 1;
                    const cls = i === values.length - 1 ? ' class="today"' : "";
                    return `<span${cls}>${sparse ? "" : parseInt(l, 10)}</span>`;
               }).join("");
          }







     }

     // Trend bars: one shared tooltip, repositioned over whichever bar is
     // hovered. Listeners sit on the container so re-renders keep working.
     (function () {
          const bars = document.getElementById("trendBars");
          const chart = bars ? bars.closest(".rsp2-wkchart") : null;
          if (!bars || !chart) return;
          const tip = document.createElement("div");
          tip.className = "rsp2-trendtip";
          chart.appendChild(tip);
          bars.addEventListener("mouseover", (e) => {
               const b = e.target.closest(".rsp2-wb");
               if (!b || !b.dataset.tt) return;
               tip.textContent = b.dataset.tt;
               const cr = chart.getBoundingClientRect();
               const br = b.getBoundingClientRect();
               const x = Math.max(34, Math.min(cr.width - 34, br.left + br.width / 2 - cr.left));
               tip.style.left = x + "px";
               tip.style.top = (br.top - cr.top) + "px";
               tip.classList.add("show");
          });
          bars.addEventListener("mouseout", (e) => {
               if (e.target.closest(".rsp2-wb")) tip.classList.remove("show");
          });
     })();

     window.addEventListener("DOMContentLoaded", checkTokenAndRender);
</script>


<script>
     const ageGroups = [
          { label: "18–24", min: 18, max: 24 },
          { label: "25–32", min: 25, max: 32 },
          { label: "33–40", min: 33, max: 40 },
          { label: "41–50", min: 41, max: 50 },
          { label: "51+", min: 51, max: 200 },
     ];

     function getScoreRange(score, range) {
          if (range === "good") return score >= 80;
          if (range === "fair") return score >= 70 && score < 80;
          if (range === "poor") return score < 70;
          return false;
     }

     // CSS rows instead of a canvas: label · stacked male/female bar · count.
     // Empty bands keep a faint track so the card always looks complete.
     async function renderAgeGenderChart() {
          const myEpoch = window.__dayEpoch; // bumped by the day-change handler, not here
          const data = await window.fetchDayRows(loginId, selectedFormattedDate);
          if (myEpoch !== window.__dayEpoch) return; // a newer day was picked mid-flight
          const scoreType = document.getElementById("scoreTypeSelector").value;
          const range = document.getElementById("scoreRangeSelector").value;

          const maleData = Array(ageGroups.length).fill(0);
          const femaleData = Array(ageGroups.length).fill(0);

          (Array.isArray(data) ? data : []).forEach((item) => {
               if (!item.gender || item.age == null || item[scoreType] == null) return;
               const age = parseInt(item.age);
               const score = parseFloat(item[scoreType]);
               if (!getScoreRange(score, range)) return;
               const index = ageGroups.findIndex((g) => age >= g.min && age <= g.max);
               if (index === -1) return;
               if (item.gender.toLowerCase() === "male") maleData[index]++;
               else if (item.gender.toLowerCase() === "female") femaleData[index]++;
          });

          const mTotal = maleData.reduce((a, b) => a + b, 0);
          const fTotal = femaleData.reduce((a, b) => a + b, 0);
          const chipsEl = document.getElementById("gaChips");
          if (chipsEl) chipsEl.innerHTML = `
               <span class="rsp2-gachip m"><span class="sw"></span>${mTotal} Male</span>
               <span class="rsp2-gachip f"><span class="sw"></span>${fTotal} Female</span>`;

          const max = Math.max(...maleData.map((v, i) => v + femaleData[i]), 1);
          const rowsEl = document.getElementById("gaRows");

          // Nobody tested on this day: show the empty state instead of five
          // rows of zeros. (The original #genderEmpty lived inside #gaRows and
          // was wiped by the first render, so it could never appear.)
          if (rowsEl && mTotal + fTotal === 0) {
               rowsEl.innerHTML = `
                    <div class="rsp-empty" id="genderEmpty">
                         <strong>No data for this day</strong>
                         <span>Fills in once subjects take tests</span>
                    </div>`;
               return;
          }

          if (rowsEl) rowsEl.innerHTML = ageGroups.map((g, i) => {
               const m = maleData[i], f = femaleData[i], tot = m + f;
               const mw = Math.round((m / max) * 100), fw = Math.round((f / max) * 100);
               return `
                    <div class="rsp2-garow" title="${g.label} yrs — ${m} male, ${f} female">
                         <div class="lbl">${g.label}</div>
                         <div class="track">${m ? `<b class="m" style="width:${mw}%"></b>` : ""}${f ? `<b class="f" style="width:${fw}%"></b>` : ""}</div>
                         <div class="cnt${tot ? "" : " zero"}">${tot}</div>
                    </div>`;
          }).join("");

     }

     document.getElementById("scoreTypeSelector").addEventListener("change", renderAgeGenderChart);
     document.getElementById("scoreRangeSelector").addEventListener("change", renderAgeGenderChart);
</script>









<script>
// (dark theme removed — the dashboard is light only)
</script>

<script>
     let donutChart;
     let currentScoreType = "Db_Score";

     // Categorize score
     function getScoreCategory(score) {
          if (score >= 80) return "good";
          if (score >= 70) return "fair";
          return "poor";
     }

     // Plugin to draw bubbles inside arcs
     const bubblePlugin = {
          id: "arcBubbles",
          afterDatasetDraw(chart) {
               const { ctx } = chart;
               const dataset = chart.getDatasetMeta(0);
               const data = chart.data.datasets[0].data;

               ctx.save();
               ctx.textAlign = "center";
               ctx.textBaseline = "middle";
               ctx.font = "bold 12px sans-serif";

               dataset.data.forEach((arc, i) => {
                    const value = data[i];
                    if (value === 0) return; // Hide bubble if value is 0

                    const angle = (arc.startAngle + arc.endAngle) / 2;
                    const radius = (arc.outerRadius + arc.innerRadius) / 2;
                    const x = chart.width / 2 + Math.cos(angle) * radius;
                    const y = chart.height / 2 + Math.sin(angle) * radius;

                    // Draw white bubble
                    ctx.beginPath();
                    ctx.arc(x, y, 14, 0, 2 * Math.PI);
                    ctx.fillStyle = "#fff";
                    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
                    ctx.shadowBlur = 4;
                    ctx.shadowOffsetX = 1;
                    ctx.shadowOffsetY = 2;
                    ctx.fill();

                    // Draw text inside bubble
                    ctx.shadowColor = "transparent"; // disable shadow for text
                    ctx.fillStyle = "#000";
                    ctx.fillText(value, x, y + 1);
               });

               ctx.restore();
          },
     };

     async function renderDonutChart() {
	  // Guard against a slow response for an older day landing after the user
	  // has already picked a newer one and repainting it with stale data.
	  // The counter is bumped by the day-change handler, once per change.
	  const myEpoch = window.__dayEpoch;

	  // shared day-rows fetch: three widgets need the same data, one request serves all
	  const raw = await window.fetchDayRows(loginId, selectedFormattedDate);
	  if (myEpoch !== window.__dayEpoch) return; // a newer day won — drop this result

	  // the API returns a bare array on success but an object on any error,
	  // and data.forEach on an object used to freeze the whole card
	  const data = Array.isArray(raw) ? raw : [];

          const counts = { good: 0, fair: 0, poor: 0 };
          let latestTimestamp = 0;

          data.forEach((item) => {
               const score = parseFloat(item[currentScoreType]);
               // skip rows with no real score for this metric, so a skipped
               // blow test is not counted as a "poor" result in the donut
               if (!window.rspHasScore(currentScoreType, item[currentScoreType])) return;

               const category = getScoreCategory(score);
               counts[category]++;
               if (item.timestamp > latestTimestamp) latestTimestamp = item.timestamp;
          });

          const total = counts.good + counts.fair + counts.poor;

	let latestDate = "No Data Found!";
	if (latestTimestamp > 0){
           latestDate = new Date(latestTimestamp * 1000).toLocaleDateString("en-GB", {
               day: "2-digit",
               month: "short",
               year: "numeric",
          });
      }
  // Count SUBJECTS for the day, independent of which score tab is selected —
  // this KPI sits outside the card and must not change when the tab does.
  const subjectsToday = new Set(data.map((r) => r.profile_id).filter(Boolean)).size;
  document.getElementById("dataCount").textContent = subjectsToday;


 //document.getElementById("dataCount").textContent = "Error";




        document.getElementById("donutCenterText").innerHTML = `
    <p>${latestDate}</p>
    <h2>${total}</h2>
    <small>${total === 1 ? "subject" : "subjects"} <br> tested</small>
  `;

        // the legend carries the counts too
        var legG = document.getElementById("legGood");
        var legF = document.getElementById("legFair");
        var legP = document.getElementById("legPoor");
        if (legG) legG.textContent = counts.good;
        if (legF) legF.textContent = counts.fair;
        if (legP) legP.textContent = counts.poor;

          // Update in place when the chart already exists — destroying and
          // recreating replayed the full entry animation (ugly zoom) on every
          // score/date change. Updating tweens the arcs smoothly instead.
          if (donutChart) {
               donutChart.data.datasets[0].data = [counts.good, counts.fair, counts.poor];
               donutChart.update();
               return;
          }

          const ctx = document.getElementById("donutChart").getContext("2d");
          donutChart = new Chart(ctx, {
               type: "doughnut",
               data: {
                    labels: ["Good", "Fair", "Poor"],
                    datasets: [
                         {
                              data: [counts.good, counts.fair, counts.poor],
                              backgroundColor: ["#3faf58", "#ffbf2d", "#e74c3c"], // Respyr design-system status colors
                              borderWidth: 2,
                              borderColor: "#ffffff",
                              borderRadius: 6, // rounded segment ends
                         },
                    ],
               },
               options: {
                    cutout: "65%",
                    responsive: true,
                    maintainAspectRatio: false, // fill the flexible card area
                    animation: { animateRotate: false, animateScale: false }, // no spin/zoom on first paint
                    plugins: {
                         legend: { display: false },
                         tooltip: { enabled: false },
                    },
               },
               plugins: [bubblePlugin],
          });
     }

     // (the old score dropdown is gone — the segmented control in the combo
     // card drives currentScoreType now; wiring lives at the end of the page)

     renderDonutChart();
</script>


<script>
    let selectedScoreKey = "Db_Score"; // Default is Sugar Score

    async function loadEmployeeTestTable() {
        // The old per-subject table is gone — the combined Scores & test log
        // card renders ALL of the day's tests instead (renderDayLog, defined
        // in the one-screen wiring block at the end of this page).
        if (window.renderDayLog) window.renderDayLog();
    }

    // 🚀 Initial load
    loadEmployeeTestTable();
</script>






















<script>
/*     fetch("https://humorstech.com/api/onboard-pat.php")
          .then((response) => response.json())
          .then((data) => {
               // document.getElementById("onboardedCount").textContent = data.onboarded;
               document.getElementById("emponboard").innerHTML = data.onboarded;
          })
          .catch((error) => {
               console.error("Error fetching data:", error);
               document.getElementById("emponboard").textContent = "Error loading data";
          });*/

 const loginId = localStorage.getItem("login_id");

     fetch(`${window.NODE_API}/api/dashboard/onboarded`, {
          method: "POST",
          headers: window.authHeaders({ "Content-Type": "application/x-www-form-urlencoded" }),
          body: new URLSearchParams({ login_id: loginId })
     })
     .then(response => response.json())
     .then(data => {
          // Example usage: show count of records
          //document.getElementById("emponboard").textContent = data.length || "0"; // or any other key
	 document.getElementById("emponboard").innerHTML = data.onboarded;
     })
     .catch(error => {
          console.error("Error fetching data:", error);
          document.getElementById("emponboard").textContent = "Error loading data";
     });

</script>



<!-- the old header-search handler lived here; it filtered #employeeTable,
     a table removed in the one-screen redesign. The test log card searches
     the selected day's tests instead. -->
<script>
     // Test log search: the magnifier expands into an input, typing filters
     // the day's log by name (or subject id). Esc / × collapses and clears.
     (function () {
          const wrap = document.getElementById("logSearch");
          const btn = document.getElementById("logSearchBtn");
          const input = document.getElementById("logSearchInput");
          const close = document.getElementById("logSearchClose");
          if (!wrap || !btn || !input || !close) return;

          function apply(q) {
               window.__dayLogQuery = q;
               window.__dayLogExpanded = false; // a new result set starts collapsed
               if (window.renderDayLog) window.renderDayLog();
          }

          function open() {
               wrap.classList.add("on");
               input.focus();
          }

          function shut() {
               wrap.classList.remove("on");
               input.value = "";
               if (window.__dayLogQuery) apply("");
          }

          btn.addEventListener("click", () => (wrap.classList.contains("on") ? shut() : open()));
          close.addEventListener("click", shut);
          input.addEventListener("input", function () { apply(this.value); });
          input.addEventListener("keydown", (e) => { if (e.key === "Escape") shut(); });

          // picking another day clears the search so the log isn't silently filtered
          window.rspClearLogSearch = function () {
               if (!wrap.classList.contains("on") && !window.__dayLogQuery) return;
               wrap.classList.remove("on");
               input.value = "";
               window.__dayLogQuery = "";
          };
     })();
</script>












<script>
    async function fetchAndPrintData() {
        const totalCount = document.getElementById("totalTest");
        const testTaken = document.getElementById("testTaken");

        try {
            const loginId = localStorage.getItem("login_id");
	   const response = await fetch(`${window.NODE_API}/api/dashboard/test-allow?login_id=${loginId}`, { headers: window.authHeaders() });

            const data = await response.json();

            const completedCount = parseFloat(data.clinical_score_count);
            const total = parseFloat(data.test_no);
            const percentage = (completedCount / total) * 100;

            testTaken.innerText = completedCount.toLocaleString("en-IN");
            if (data.test_allow === "true" || data.test_allow === true) {
                totalCount.innerText = `/${total.toLocaleString("en-IN")}`;
            }

            // radial gauge: arc length out of a r=20 circle (circumference 125.66)
            const fill = document.getElementById("gaugeFill");
            const pctText = document.getElementById("gaugePct");
            if (fill && Number.isFinite(percentage)) {
                const pct = Math.max(0, Math.min(100, percentage));
                fill.setAttribute("stroke-dasharray", `${(pct * 1.2566).toFixed(1)} 125.66`);
                fill.style.stroke = pct >= 90 ? "var(--red)" : "var(--green)";
            }
            if (pctText && Number.isFinite(percentage)) {
                pctText.textContent = `${Math.round(percentage)}%`;
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    fetchAndPrintData();
</script>











<script>
const input = document.getElementById('dateInput');
const datepicker = new Datepicker(input, {
  format: 'dd-mm-yyyy',
  autohide: true,
  todayHighlight: true,
  weekStart: 1,                // week runs Monday → Sunday
  maxDate: new Date(),         // no future dates
  // maxDate is evaluated once at construction, so a dashboard left open past
  // midnight could not select the new day. Refresh it whenever the picker opens.
  beforeShowDay: function (d) {
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return (window.testDates && window.testDates.has(key)) ? 'has-test' : '';
  }
});

// Two ways in, two behaviours:
//  ICON click  → dropdown only. The picker's show() focuses the input
//                internally, so .icon-open suppresses the lift and caret.
//  DATE click  → the text lifts, the dropdown opens, and the caret appears
//                at the end of the date once the lift has finished.
// keep "today" current for a long-lived tab
input.addEventListener("show", function () {
  try { datepicker.setOptions({ maxDate: new Date() }); } catch (e) { /* older build */ }
});

const dateGroup = input.closest(".input-group");
const dateIconBox = dateGroup?.querySelector('.input-group-text');
if (dateIconBox) {
  dateIconBox.style.cursor = 'pointer';
  dateIconBox.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dateGroup) dateGroup.classList.add('icon-open');
    datepicker.show();
  });
}

// only the FIRST click (the one that focuses the field) parks the caret at
// the end; once focused, clicks place the caret wherever the user wants
input.addEventListener("focus", () =>
  requestAnimationFrame(() => {
    const n = input.value.length;
    input.setSelectionRange(n, n);
  })
);

input.addEventListener("focus", () => {
  if (!dateGroup || dateGroup.classList.contains("icon-open")) return;
  setTimeout(() => dateGroup.classList.add("caret-on"), 190);
});
// a direct click on the date converts an icon-opened state into the full one
input.addEventListener("mousedown", () => {
  if (!dateGroup) return;
  dateGroup.classList.remove("icon-open");
  setTimeout(() => dateGroup.classList.add("caret-on"), 190);
});
input.addEventListener("blur", () => {
  if (dateGroup) dateGroup.classList.remove("caret-on", "icon-open");
});

// this is a date, not a text field: digits and dashes only, dd-mm-yyyy length
input.setAttribute("maxlength", "10");
input.setAttribute("inputmode", "numeric");
input.addEventListener("beforeinput", (e) => {
  if (e.data && /[^0-9-]/.test(e.data)) e.preventDefault();
});
input.addEventListener("input", () => {
  const clean = input.value.replace(/[^0-9-]/g, "").slice(0, 10);
  if (input.value !== clean) input.value = clean;
});

// once a day is picked, the field is done: caret and lift leave with the
// dropdown while the page loads the new day
input.addEventListener("changeDate", () => input.blur());

const today = new Date(); // today's date
datepicker.setDate(today);


// ✅ Manually set the global formatted date
const day = String(today.getDate()).padStart(2, '0');
const month = String(today.getMonth() + 1).padStart(2, '0');
const year = today.getFullYear();
selectedFormattedDate = `${day}/${month}/${year}`;
console.log("Auto-filled selectedFormattedDate:", selectedFormattedDate);

// ✅ Update date when user selects manually
input.addEventListener('changeDate', function () {
  const picked = datepicker.getDate();            // reliable Date from the picker
  if (picked) {
    const dd = String(picked.getDate()).padStart(2, '0');
    const mm = String(picked.getMonth() + 1).padStart(2, '0');
    selectedFormattedDate = `${dd}/${mm}/${picked.getFullYear()}`;
  } else {
    selectedFormattedDate = input.value.replace(/-/g, '/');
  }
  // one bump per day change: in-flight responses for the previous day are
  // dropped instead of repainting the cards with the wrong day's data
  window.__dayEpoch = (window.__dayEpoch || 0) + 1;
  // Re-render every date-dependent widget; isolate failures so one bad widget
  // doesn't stop the others from updating. These two are async, so a rejected
  // promise needs .catch() — a try/catch around the call cannot see it.
  try { renderAgeGenderChart()?.catch?.((e) => console.warn('ageGender', e)); } catch (e) { console.warn('ageGender', e); }
  try { renderDonutChart()?.catch?.((e) => console.warn('donut', e)); }        catch (e) { console.warn('donut', e); }
  try { loadEmployeeTestTable(); } catch (e) { console.warn('testTable', e); }
  try { if (window.weeksData) renderChart(window.weeksData, parseInt(document.getElementById('rangeSelector').value, 10) || 7); } catch (e) { console.warn('trend', e); }
  try { if (window.updateDayWidgets) updateDayWidgets(); } catch (e) { console.warn('daybar', e); }
});

// ✅ Now safe to call this
renderAgeGenderChart();
renderDonutChart();

// Mark the calendar days that actually have test data.
window.testDates = new Set();
fetch(`${window.NODE_API}/api/dashboard/test-dates?login_id=${encodeURIComponent(window.loginId || 'OFFC')}`, { headers: window.authHeaders() })
  .then(r => r.json())
  .then(dates => { (dates || []).forEach(d => window.testDates.add(d)); datepicker.refresh(); })
  .catch(e => console.warn('test-dates', e));
</script>

<script>
// ===================== ONE-SCREEN WIRING =====================
// Day strip, combined test log, segmented controls. Everything funnels
// through the existing datepicker pipeline: clicking a strip day calls
// datepicker.setDate(), which fires changeDate, which re-renders all widgets.

const RSP_MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const RSP_WD = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const RSP_WD_FULL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const RSP_PPM = { Db_Score: ["Acetone", "acetone_ppm"], liver_score: ["Ethanol", "ethnol_ppm"], Gut_Score_per: ["H\u2082", "h2_ppm"] };

function rspSelectedDate() {
     const p = (selectedFormattedDate || "").split("/"); // dd/mm/yyyy
     if (p.length === 3) return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
     return new Date();
}
function rspDayKey(d) { return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }

// A test's day must be decided in CLINIC time (Asia/Kolkata), not in whatever
// timezone the browser happens to be in. The API buckets by its IST dttm string,
// so bucketing timestamps locally put early-morning / late-night tests on the
// neighbouring day for any admin outside India — the log and "Tests this day"
// disagreed with the donut on the same screen.
const RSP_TZ = "Asia/Kolkata";
const rspTzFmt = new Intl.DateTimeFormat("en-CA", {
     timeZone: RSP_TZ, year: "numeric", month: "2-digit", day: "2-digit",
});
function rspTsKey(ts) {
     const parts = rspTzFmt.formatToParts(new Date(ts * 1000));
     const get = (type) => parts.find((x) => x.type === type).value;
     // same shape as rspDayKey (no zero padding) so the two compare equal
     return `${parseInt(get("year"), 10)}-${parseInt(get("month"), 10)}-${parseInt(get("day"), 10)}`;
}

// every reading of the selected day, newest first (from the weeks dataset)
function rspDayRows() {
     const k = rspDayKey(rspSelectedDate());
     return (window.weeksData || [])
          .filter((r) => rspTsKey(parseInt(r.timestamp, 10)) === k)
          .sort((a, b) => parseInt(b.timestamp, 10) - parseInt(a.timestamp, 10));
}

// ---- the day's full test log, driven by the selected score ----
window.renderDayLog = function () {
     const list = document.getElementById("dayLog");
     const foot = document.getElementById("dayLogFoot");
     if (!list) return;
     const all = rspDayRows();
     const key = (typeof selectedScoreKey !== "undefined" && selectedScoreKey) || "Db_Score";
     const AV = ["#308bf9", "#3faf58", "#e48326", "#8e44ad", "#0ea5a4", "#e74c3c", "#6366f1", "#d97706"];

     // the card's own search box filters this day's tests by name / subject id.
     // Matches are ranked so the most name-like ones lead: a name starting with
     // the query beats a later word starting with it, which beats a match inside
     // a word ("ar" puts Arup above Sagar). Ties keep the newest-first order.
     const q = (window.__dayLogQuery || "").trim().toLowerCase();
     let rows = all;
     if (q) {
          const rank = (r) => {
               const name = (r.name || "").toLowerCase();
               const pid = (r.profile_id || "").toLowerCase();
               if (name.startsWith(q)) return 0;
               if (name.split(/\s+/).some((w) => w.startsWith(q))) return 1;
               if (pid.startsWith(q)) return 2;
               if (name.includes(q)) return 3;
               return pid.includes(q) ? 4 : 99;
          };
          rows = all
               .map((r, i) => ({ r, i, k: rank(r) }))
               .filter((x) => x.k !== 99)
               .sort((a, b) => a.k - b.k || a.i - b.i)
               .map((x) => x.r);
     }

     if (!all.length) {
          list.innerHTML = `
               <div class="rsp2-logempty">
                    <strong>No tests on this day</strong>
                    <span>Pick a day with a green dot to see its tests</span>
               </div>`;
          if (foot) foot.textContent = "";
          return;
     }

     if (!rows.length) {
          list.innerHTML = `
               <div class="rsp2-logempty">
                    <strong>No match for &ldquo;${q.replace(/[<>&]/g, "")}&rdquo;</strong>
                    <span>No one with that name tested on this day</span>
               </div>`;
          if (foot) foot.textContent = `0 of ${all.length} test${all.length === 1 ? "" : "s"} match`;
          return;
     }

     // Busy days (100+ tests) stay fast and scannable: show the first batch,
     // expand on demand — the data is already in memory, so it's instant.
     const LOG_LIMIT = 30;
     const expanded = !!window.__dayLogExpanded;
     const shown = expanded ? rows : rows.slice(0, LOG_LIMIT);

     list.innerHTML = shown.map((r) => {
          // A missing / not-performed score must NOT render as a red 0%.
          const raw = parseFloat(r[key]);
          const has = window.rspHasScore(key, r[key]);
          const score = Number.isFinite(raw) ? Math.round(raw) : null;
          const band = !has ? "none" : score >= 80 ? "good" : score >= 70 ? "fair" : "poor";
          const name = r.name || r.profile_id || "Unknown";
          const initial = (name.trim().charAt(0) || "?").toUpperCase();
          const av = AV[(initial.charCodeAt(0) || 65) % AV.length];
          const t = new Date(parseInt(r.timestamp, 10) * 1000);
          const time = isNaN(t.getTime()) ? "" : t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const ppm = RSP_PPM[key];
          let marker = "";
          if (ppm && r[ppm[1]] != null && r[ppm[1]] !== "") {
               marker = `${ppm[0]} \u00b7 ${parseFloat(r[ppm[1]]).toFixed(1)} ppm`;
          }
          return `
               <div class="rsp2-logitem">
                    <div class="rsp2-logavatar" style="background:${av}1a;color:${av}">${rspEsc(initial)}</div>
                    <div class="rsp2-logmeta">
                         <div class="nm">${rspEsc(name)}</div>
                         <div class="tm">${time}</div>
                    </div>

                    <div class="rsp2-logscore">
                         <span class="rsp2-scorepill ${band}"><span class="rsp-dot"></span>${has ? score + "%" : "\u2014"}</span>
                         ${marker ? `<div class="mk">${rspEsc(marker)}</div>` : ""}
                    </div>
               </div>`;
     }).join("");

     const segBtn = document.querySelector("#scoreSeg button.on");
     const scoreName = segBtn ? segBtn.dataset.label : "Sugar";
     if (foot) {
          if (rows.length > shown.length) {
               foot.innerHTML = `Showing ${shown.length} of ${rows.length} tests \u00b7 ${scoreName} score
                    <button type="button" class="rsp2-showall" onclick="window.__dayLogExpanded=true;renderDayLog()">Show all ${rows.length}</button>`;
          } else if (q) {
               foot.textContent = `${rows.length} of ${all.length} test${all.length === 1 ? "" : "s"} match \u00b7 ${scoreName} score`;
          } else {
               foot.textContent = `All ${rows.length} test${rows.length === 1 ? "" : "s"} on this day \u00b7 ${scoreName} score`;
          }
     }
};

// ---- labels + counters that follow the selected day ----
window.updateDayWidgets = function () {
     const d = rspSelectedDate();
     const ctx = document.getElementById("comboCtx");
     if (ctx) ctx.textContent = `\u00b7 ${d.getDate()} ${RSP_MON[d.getMonth()]}`;
     const tt = document.getElementById("testsThisDay");
     if (tt) tt.textContent = rspDayRows().length;
     window.__dayLogExpanded = false; // a new day starts collapsed again
     if (window.rspClearLogSearch) window.rspClearLogSearch(); // and unfiltered
     renderDayLog();
};

// ---- segmented controls ----
document.querySelectorAll("#scoreSeg button").forEach((b) =>
     b.addEventListener("click", () => {
          document.querySelectorAll("#scoreSeg button").forEach((x) => x.classList.toggle("on", x === b));
          const key = b.dataset.score;
          try { currentScoreType = key; } catch (e) {}
          try { selectedScoreKey = key; } catch (e) {}
          // drives ONLY this card — Gender & age has its own score selector
          try { renderDonutChart(); } catch (e) {}
          renderDayLog();
     })
);
document.querySelectorAll("#rangeSeg button").forEach((b) =>
     b.addEventListener("click", () => {
          document.querySelectorAll("#rangeSeg button").forEach((x) => x.classList.toggle("on", x === b));
          const days = parseInt(b.dataset.days, 10) || 7;
          const sel = document.getElementById("rangeSelector");
          if (sel) sel.value = String(days);
          if (window.weeksData) renderChart(window.weeksData, days);
     })
);
// first paint (weeksData may not be in yet — checkTokenAndRender calls again)
updateDayWidgets();
</script>

<script>
// Custom dropdowns (.rsp2-dd): native <select> menus can't be styled, so the
// visible control is ours and the hidden select underneath carries the state.
document.querySelectorAll(".rsp2-dd").forEach((dd) => {
     const btn = dd.querySelector(".rsp2-ddbtn");
     const menu = dd.querySelector(".rsp2-ddmenu");
     const sel = document.getElementById(dd.dataset.for);
     btn.addEventListener("click", (e) => {
          e.stopPropagation();
          document.querySelectorAll(".rsp2-dd.open").forEach((o) => { if (o !== dd) o.classList.remove("open"); });
          dd.classList.toggle("open");
     });
     menu.querySelectorAll("button").forEach((o) =>
          o.addEventListener("click", (e) => {
               e.stopPropagation();
               menu.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === o));
               const lbl = btn.querySelector(".lbl");
               if (lbl) lbl.innerHTML = Array.from(o.children)
                    .filter((c) => !c.classList.contains("fa-check"))
                    .map((c) => c.outerHTML).join("");
               if (sel && sel.value !== o.dataset.value) {
                    sel.value = o.dataset.value;
                    sel.dispatchEvent(new Event("change"));
               }
               dd.classList.remove("open");
          })
     );
});
document.addEventListener("click", () =>
     document.querySelectorAll(".rsp2-dd.open").forEach((o) => o.classList.remove("open"))
);
</script>
