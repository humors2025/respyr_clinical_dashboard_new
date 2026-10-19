  <script src="https://cdn.jsdelivr.net/npm/jwt-decode@3.1.2/build/jwt-decode.min.js"></script>
  <style>



	td[data-label="Tests taken"] {

text-align: center;
    vertical-align: middle;
	}
	th[data-label="Tests taken"] {
  	text-align: center;
	}



    .card-style{
      padding:0;
    }

.text-primary{

color:#308BF9;
}





  </style>

<div id="scoreContainer"><p>Loading scores...</p></div>
<div id="scorePager" class="rsp-pager" style="display:none"></div>




<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jwt-decode/build/jwt-decode.min.js"></script>

<script>
  let originalData = [];

  // ---- pagination state (server-side; 20 subjects per page) ----
  const PAGE_LIMIT = 20;
  let curPage = 1;
  let curSearch = "";
  let histLoginId = "";

  function checkTokenAndRender() {
    const token = localStorage.getItem("jwt_token");

    if (!token) {
      window.location.href = "index.php";
      return;
    }

    try {
      const decoded = jwt_decode(token);
      const now = Math.floor(Date.now() / 1000);

      if (decoded.exp < now) throw new Error("Token expired");

      document.getElementById("welcome2").textContent = `Welcome, ${decoded.username || decoded.login_id}!`;
      histLoginId = decoded.username || decoded.login_id;

      loadScores();
    } catch (err) {
      console.warn("Invalid or expired token:", err.message);
      localStorage.removeItem("jwt_token");
      window.location.href = "../clinical-v2/";
    }
  }

  // Typing fast fired several requests; whichever answered LAST won, so a
  // stale response could paint filtered rows under an unfiltered pager.
  // Only the newest request is allowed to touch the DOM.
  let scoresReqId = 0;

  function loadScores() {
    const myReq = ++scoresReqId;
    fetch(`${window.NODE_API}/api/dashboard/scores`, {
      method: "POST",
      headers: window.authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ login_id: histLoginId, page: curPage, limit: PAGE_LIMIT, search: curSearch }),
    })
      .then((res) => res.json())
      .then((resp) => {
        if (myReq !== scoresReqId) return; // a newer search/page won
        const container = document.getElementById("scoreContainer");

        if (resp && resp.error) {
          // the backend's raw error text is not rendered as HTML
          container.textContent = "Could not load the test logs. Please try again.";
          return;
        }

        const data = resp && Array.isArray(resp.data) ? resp.data : [];
        originalData = data;

        const dc = document.getElementById("dataCount");
        if (dc) dc.textContent = `${resp.total ?? data.length}`;

        renderTable(data);
        renderPager(resp.page || 1, resp.limit || PAGE_LIMIT, resp.total || 0);
        // live count under the page heading
        const sub = document.getElementById("pageSub");
        if (sub) {
          const n = resp.total || 0;
          const word = n === 1 ? "subject" : "subjects";
          sub.textContent = curSearch
            ? n + " matching " + word
            : "The most recent test for each of " + n + " " + word;
        }

        updateScoreCounts(currentScoreKeyForCounts, data);
        renderGenderChart(data);
      })
      .catch((err) => {
        console.warn("API fetch failed:", err.message);
        document.getElementById("scoreContainer").innerHTML =
          "<p style='color:red;'>Failed to load scores. Please try again.</p>";
      });
  }

  function renderPager(page, limit, total) {
    const el = document.getElementById("scorePager");
    if (!el) return;
    const pages = Math.max(1, Math.ceil(total / limit));
    const from = total === 0 ? 0 : (page - 1) * limit + 1;
    const to = Math.min(total, page * limit);
    el.style.display = total > 0 ? "flex" : "none";
    el.innerHTML = `
      <span class="rsp-pager-info">Showing ${from}–${to} of ${total} subjects</span>
      <div class="rsp-pager-controls">
        <button class="rsp-page-btn" ${page <= 1 ? "disabled" : ""} data-go="${page - 1}"><i class="fa-solid fa-chevron-left"></i></button>
        <span class="rsp-pager-page">Page ${page} of ${pages}</span>
        <button class="rsp-page-btn" ${page >= pages ? "disabled" : ""} data-go="${page + 1}"><i class="fa-solid fa-chevron-right"></i></button>
      </div>`;
    el.querySelectorAll(".rsp-page-btn").forEach((b) =>
      b.addEventListener("click", () => { curPage = parseInt(b.dataset.go, 10); loadScores(); })
    );
  }

  // ---- stats + gender donut (elements live in a hidden section of history.php;
  //      they now reflect the current page only) ----
  let currentScoreKeyForCounts = "Db_Score";

  function updateScoreCounts(scoreType, data) {
    const g = document.getElementById("goodCount");
    const f = document.getElementById("fairCount");
    const p = document.getElementById("poorCount");
    if (!g || !f || !p) return;
    let good = 0, fair = 0, poor = 0;
    data.forEach((entry) => {
      const value = parseFloat(entry[scoreType]);
      if (isNaN(value)) return;
      if (value >= 80) good++;
      else if (value >= 70 && value < 80) fair++;
      else poor++;
    });
    g.textContent = good;
    f.textContent = fair;
    p.textContent = poor;
  }

  function renderGenderChart(data) {
    const genderCanvas = document.getElementById("genderChart");
    if (!genderCanvas) return;
    const maleCount = data.filter((item) => item.gender?.toLowerCase() === "male").length;
    const femaleCount = data.filter((item) => item.gender?.toLowerCase() === "female").length;

    // On back-navigation the page is restored from bfcache and this runs
    // again — destroy the previous chart or Chart.js throws "canvas is
    // already in use", which lands in .catch() and wipes the table.
    const existingGenderChart = Chart.getChart(genderCanvas);
    if (existingGenderChart) existingGenderChart.destroy();
    const ctx = genderCanvas.getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Male", "Female"],
        datasets: [{
          data: [maleCount, femaleCount],
          backgroundColor: ["#90C3F9", "#1B4E9B"],
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const label = e.target.textContent.trim().toLowerCase();
        let key = "";

        if (label === "sugar score") key = "Db_Score";
        else if (label === "liver score") key = "liver_score";
        else if (label === "respiratory score") key = "Blow_Score";
        else if (label === "gut score") key = "Gut_Score_per";

        const toggleBtn = document.querySelector(".btn.dropdown-toggle");
        if (toggleBtn) toggleBtn.textContent = e.target.textContent;
        if (key) { currentScoreKeyForCounts = key; updateScoreCounts(key, originalData); }
      });
    });
  });

  // "09/04/2026 18:13:59" (US order, ambiguous) -> "04 Sep 2026, 18:13"
  function fmtLastTested(dttm) {
    const m = String(dttm || "").match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2})/);
    if (!m) return dttm || "";
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${m[2]} ${months[parseInt(m[1], 10) - 1]} ${m[3]}, ${m[4]}:${m[5]}`;
  }

  // Builds the full report URL on click — including the breath-pressure data
  // the report's respiratory section needs (missing from the old static links).
  function openScoreReport(i) {
    const s = (window.__scoreRows || [])[i];
    if (!s) return;
    // the breath trace is handed over in sessionStorage, not the URL (too big)
    const blowKey = "rspblow:" + Date.now() + ":" + Math.random().toString(36).slice(2, 8);
    try { sessionStorage.setItem(blowKey, s.blow_raw_values ?? ""); } catch (e) { /* storage blocked */ }
    const qs = new URLSearchParams({
      login_id: s.login_id, profile_id: s.profile_id,
      sugar: s.Db_Score, liver: s.liver_score, resp: s.Blow_Score, guts: s.Gut_Score_per,
      acetone_ppm: s.acetone_ppm ?? "NA", ethnol_ppm: s.ethnol_ppm ?? "NA", h2_ppm: s.h2_ppm ?? "NA",
      bk: blowKey,
      dttm: s.dttm, name: s.name ?? "", age: s.age ?? "", gender: s.gender ?? "",
      height: s.height ?? "", weight: s.weight ?? "",
    });
    openReportModal("./report/user_report?" + qs.toString());
  }

  // Subject names are typed in the mobile app, so they are untrusted input:
  // escape before building row HTML.
  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function renderTable(filteredData) {
    // rows kept for the report links: the breath blobs (blow_raw_values /
    // respiratory_fvc_json) are too big to bake into every href, so the
    // report URL is built lazily on click from this array.
    window.__scoreRows = filteredData;
    const rows = filteredData.map((score, idx) => `
      <tr class="data-row">
        <td data-label="Subject Name">
          <div class="emplyee-name-wrapper">
            <h2 class="employee-name">${esc(score.name || "N/A")}</h2>
            <div class="emp_id">
              <span>${esc(score.profile_id)}</span>
              <div class="dot"></div>
              <span>Last tested ${fmtLastTested(score.dttm)}</span>
            </div>
          </div>
        </td>
        <td data-label="Tests taken">${score.count_taken || 0}</td>
        <td data-label="Sugar score">${score.Db_Score || 0}%</td>
        <td data-label="Liver score">${score.liver_score || 0}%</td>
        <td data-label="Respiratory score">${score.Blow_Score || 0}%</td>
        <td data-label="Gut score">${score.Gut_Score_per || 0}%</td>
        <td>
          <a class="btn btn-tranperent btn-sm" data-tip="View profile"
             href='view-profile?login_id=${encodeURIComponent(score.login_id)}&profile_id=${encodeURIComponent(score.profile_id)}&sugar=${encodeURIComponent(score.Db_Score)}&liver=${encodeURIComponent(score.liver_score)}&resp=${encodeURIComponent(score.Blow_Score)}&guts=${encodeURIComponent(score.Gut_Score_per)}&dttm=${encodeURIComponent(score.dttm)}&name=${encodeURIComponent(score.name)}'>
            <i class="fa-solid fa-user text-primary"></i>
          </a>
          <a class="btn btn-tranperent btn-sm" data-tip="Open report"
             href='#' onclick='openScoreReport(${idx}); return false;'>
            <i class="fa-solid fa-file-lines text-primary"></i>
          </a>
        </td>
      </tr>
    `).join('');

    document.getElementById("scoreContainer").innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th scope="col">Subject Name</th>
            <th scope="col" data-label="Tests taken">Tests Taken</th>
            <th scope="col" >Sugar score</th>
            <th scope="col" >Liver score</th>
            <th scope="col">Respiratory score</th>
            <th scope="col">Gut score</th>
            <th scope="col">View</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function logout() {
    localStorage.removeItem("jwt_token");
    window.location.href = "../clinical-v2/";
  }

  window.addEventListener("pageshow", checkTokenAndRender);

  // 🔍 Search — server-side now (covers ALL subjects, not just the loaded page),
  // debounced so we don't fire a request per keystroke.
  document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search");
    if (searchInput) {
      let searchTimer = null;
      searchInput.addEventListener("input", function () {
        clearTimeout(searchTimer);
        const q = this.value.trim();
        searchTimer = setTimeout(() => {
          curSearch = q;
          curPage = 1;
          loadScores();
        }, 350);
      });
    }
  });
</script>

<script>
  function toggleTooltip(el) {
    const menu = el.querySelector('.tooltip-menu');
    const isOpen = menu.style.display === 'block';
    document.querySelectorAll('.tooltip-menu').forEach(m => m.style.display = 'none');
    menu.style.display = isOpen ? 'none' : 'block';
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.tooltip-container')) {
      document.querySelectorAll('.tooltip-menu').forEach(m => m.style.display = 'none');
    }
  });
</script>
