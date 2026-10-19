<header class="header rsp-hd">
  <div class="rsp-hd-in">

    <!-- menu button (visible only when the sidebar is hidden) -->
    <div class="menu-toggle-btn">
      <button id="menu-toggle" class="rsp-hd-burger" aria-label="Open menu">
        <i class="lni lni-menu"></i>
      </button>
    </div>

    <!-- greeting -->
    <div class="rsp-hd-greet">
      <h6><span id="rspGreetTime">Hello</span>, <span id="rspGreetName"></span></h6>
      <p id="rspGreetDate"></p>
    </div>

    <!-- tools -->
    <div class="rsp-hd-tools">
      <?php /* Opt-in: only list pages that actually wire up #search show it.
               Set $showHeaderSearch = true; before including this header.
               Profile and Clinic profile deliberately have no search box. */ ?>
      <?php if (!empty($showHeaderSearch)): ?>
      <div class="header-search rsp-hd-search">
        <form action="#" onsubmit="return false">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="search" placeholder="<?php echo htmlspecialchars($headerSearchPlaceholder ?? 'Search...', ENT_QUOTES); ?>" autocomplete="off" />
        </form>
      </div>
      <?php endif; ?>

      <span class="rsp-hd-sep"></span>
    </div>

    <!-- profile -->
    <div class="profile-box dropdown">
      <button class="rsp-hd-user" type="button" id="profile" data-bs-toggle="dropdown" aria-expanded="false">
        <img id="clinicLogo" alt="" class="rsp-hd-ava" />
        <span class="rsp-hd-user-txt">
          <strong id="rspGreetName2"></strong>
          <small>Administrator</small>
        </span>
        <i class="fa-solid fa-chevron-down rsp-hd-chev"></i>
        <span id="welcome2" hidden></span>
      </button>
      <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="profile">
        <li><a href="./admin-profile"><i class="fa-solid fa-user"></i> Profile</a></li>
        <li><a href="#0" id="logoutBtn" onclick="logout()"><i class="lni lni-exit"></i> Sign Out</a></li>
      </ul>
    </div>

  </div>
</header>

<script>
  const clinicName = localStorage.getItem("login_id");
// clinic logo now comes from our own dashboard backend (the old
  // humorstech.com call could hang for 20s, which is why the placeholder
  // person icon used to sit there before flipping to the initial)
  const logoImg = document.getElementById("clinicLogo");
  const firstLetter = clinicName.charAt(0).toUpperCase();

  const colorMap = {
    A: "#FF6B6B", B: "#6BCB77", C: "#4D96FF", D: "#FFB74D", E: "#9575CD", F: "#26A69A",
    G: "#FF7043", H: "#42A5F5", I: "#66BB6A", J: "#FFCA28", K: "#AB47BC", L: "#26C6DA",
    M: "#EC407A", N: "#8D6E63", O: "#5C6BC0", P: "#9CCC65", Q: "#29B6F6", R: "#F06292",
    S: "#7986CB", T: "#D4E157", U: "#00ACC1", V: "#FF8A65", W: "#BA68C8", X: "#4DB6AC",
    Y: "#FFD54F", Z: "#90CAF9"
  };

  function generateInitialImage(letter) {
    const canvas = document.createElement("canvas");
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext("2d");

    const bgColor = colorMap[letter] || "#607D8B";

    ctx.beginPath();
    ctx.arc(20, 20, 20, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = bgColor;
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, 20, 22);

    return canvas.toDataURL("image/png");
  }

  // Show the clinic initial straight away so the avatar never flashes a
  // generic person icon while a network call is in flight.
  logoImg.src = generateInitialImage(firstLetter);

  fetch(`${window.NODE_API}/api/clinic/logos`, {
    method: "POST",
    headers: window.authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ login_id: clinicName }),
  })
    .then(res => (res.ok ? res.json() : Promise.reject(new Error("HTTP " + res.status))))
    .then(data => {
      const src = data && data.status === "success" ? (data.data || {}).logo_src : null;
      if (src) logoImg.src = src;   // real logo found — upgrade from the initial
    })
    .catch(error => {
      // no logo uploaded, or the lookup failed: the initial already stands in
      console.warn("Clinic logo unavailable:", error.message);
    });

  // Greeting block: time-of-day + clinic name + today's date in words
  (function () {
    const h = new Date().getHours();
    const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    const gt = document.getElementById("rspGreetTime"); if (gt) gt.textContent = g;
    const n1 = document.getElementById("rspGreetName"); if (n1) n1.textContent = clinicName || "";
    const n2 = document.getElementById("rspGreetName2"); if (n2) n2.textContent = clinicName || "";
    const d = document.getElementById("rspGreetDate");
    if (d) d.textContent = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  })();
</script>
