<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/jwt-decode@3.1.2/build/jwt-decode.min.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      border-bottom: 1px solid #ddd;
      text-align: left;
    }
    .employee-name {
      margin: 0;
      font-size: 1.1em;
    }
    .emp_id {
      font-size: 0.85em;
      color: #666;
      display: flex;
      align-items: center;
    }
    .dot {
      height: 6px;
      width: 6px;
      background-color: #888;
      border-radius: 50%;
      display: inline-block;
      margin: 0 6px;
    }
    .data-row:hover {
      background-color: #f3f3f3;
      cursor: pointer;
    }
    #logoutBtn {
      float: right;
      margin-top: 10px;
    }
  </style>
</head>
<body>

  <!-- <h2 id="welcome">Loading...</h2> -->
  <button id="logoutBtn" onclick="logout()">Logout</button>
  <div id="scoreContainer"><p>Loading scores...</p></div>




<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jwt-decode/build/jwt-decode.min.js"></script>

<!-- Add Chart.js script in your HTML -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
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

      fetch("../login/data-api.php", {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + token
        }
      })
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById("scoreContainer");

        if (data.error) {
          container.innerHTML = `<p style="color: red;">${data.error}</p>`;
          return;
        }

        const count = Array.isArray(data) ? data.length : 0;
        document.getElementById("dataCount").textContent = `${count}`;

        if (count > 0) {
          const rows = data.map(score => `
            <tr class="data-row" data-id="${score.profile_id}">
              <td data-label="Employee Name">
                <div class="emplyee-name-wrapper">
                  <h2 class="employee-name">${score.name || "N/A"}</h2>
                  <div class="emp_id">
                    <span>${score.profile_id}</span>
                    <div class="dot"></div>
                    <span>Last tested ${score.dttm}</span>
                  </div>
                </div>
              </td>
              <td data-label="Sugar score">${score.Db_Score || 0}%</td>
              <td data-label="Liver score">${score.liver_score || 0}%</td>
              <td data-label="Respiratory score">${score.Blow_Score || 0}%</td>
              <td data-label="Gut score">${score.Gut_Score_per || 0}%</td>
            </tr>
          `).join('');

          container.innerHTML = `
            <table>
              <thead>
                <tr>
                  <th scope="col">Employee Name</th>
                  <th scope="col">Sugar score</th>
                  <th scope="col">Liver score</th>
                  <th scope="col">Respiratory score</th>
                  <th scope="col">Gut score</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          `;

          document.querySelectorAll(".data-row").forEach(row => {
            row.addEventListener("click", () => {
              const profileId = row.getAttribute("data-id");
              console.log("Clicked profile ID:", profileId);
            });
          });

          // ✅ Score Categorization Function
          function updateScoreCounts(scoreType, data) {
            let good = 0, fair = 0, poor = 0;
            data.forEach(entry => {
              const value = parseFloat(entry[scoreType]);
              if (isNaN(value)) return;
              if (value >= 80) good++;
              else if (value >= 70) fair++;
              else poor++;
            });
            document.getElementById("goodCount").textContent = good;
            document.getElementById("fairCount").textContent = fair;
            document.getElementById("poorCount").textContent = poor;
          }

          // ✅ Initialize with default (Sugar score)
          updateScoreCounts("Db_Score", data);

          // ✅ Dropdown change handler
          document.querySelectorAll(".dropdown-item").forEach(item => {
            item.addEventListener("click", (e) => {
              e.preventDefault();
              const label = e.target.textContent.trim().toLowerCase();
              let key = "";

              if (label === "sugar score") key = "Db_Score";
              else if (label === "liver score") key = "liver_score";
              else if (label === "respiratory score") key = "Blow_Score";
              else if (label === "gut score") key = "Gut_Score_per";

              document.querySelector(".btn.dropdown-toggle").textContent = e.target.textContent;
              updateScoreCounts(key, data);
            });
          });

          // ✅ Gender Chart
          const maleCount = data.filter(item => item.gender?.toLowerCase() === 'male').length;
          const femaleCount = data.filter(item => item.gender?.toLowerCase() === 'female').length;

          const ctx = document.getElementById("genderChart").getContext("2d");
          new Chart(ctx, {
            type: "doughnut",
            data: {
              labels: ["Male", "Female"],
              datasets: [{
                data: [maleCount, femaleCount],
                backgroundColor: ["#90C3F9", "#1B4E9B"],
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' }
              }
            }
          });

        } else {
          container.innerHTML = "<p>No scores found.</p>";
        }
      })
      .catch(err => {
        console.warn("API fetch failed:", err.message);
        document.getElementById("scoreContainer").innerHTML =
          "<p style='color:red;'>Failed to load scores. Please try again.</p>";
      });

    } catch (err) {
      console.warn("Invalid or expired token:", err.message);
      localStorage.removeItem("jwt_token");
      window.location.href = "index.php";
    }
  }

  function logout() {
    localStorage.removeItem("jwt_token");
    window.location.href = "index.php";
  }

  window.addEventListener("pageshow", checkTokenAndRender);
</script>

</body>
</html>
