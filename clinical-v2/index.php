<?php
header("Location:./login-port/");
?>

<!DOCTYPE html>
<html>
<head>
  <title>Login</title>
</head>
<body>
  <h2>Login</h2>
  <form id="loginForm">
    <input type="text" id="username" placeholder="Username" required><br>
    <input type="password" id="password" placeholder="Password" required><br>
    <button type="submit">Login</button>
  </form>
  <p id="msg"></p>

  <script>
    document.getElementById("loginForm").addEventListener("submit", async function(e) {
      e.preventDefault();

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      const res = await fetch("login-api.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username, password })
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("jwt_token", data.token);
        window.location.href = "../clinical-dashboard_v2/usage_analytics.php";
      } else {
        document.getElementById("msg").innerText = data.error || "Login failed.";
      }
    });
  </script>
</body>
</html>
