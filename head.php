
<head>

    <!-- ===== LOCAL DEV CONFIG (single place to swap for Lambda) ===== -->
    <script>
      // Base URL of the Node backend the dashboard talks to.
      window.NODE_API = "http://localhost:3001";            // local testing
      // window.NODE_API = "<DASHBOARD-LAMBDA-URL>"; // prod — the DASHBOARD backend's own Function URL (NOT the app's)

      // Attach the signed-in user's token to API calls. Dashboard endpoints
      // now REQUIRE it server-side â€” sign in at /clinical-v2/ to use the app.
      window.authHeaders = function (extra) {
        var t = null;
        try { t = localStorage.getItem("jwt_token"); } catch (e) {}
        var h = extra ? Object.assign({}, extra) : {};
        if (t) h["Authorization"] = "Bearer " + t;
        return h;
      };
    </script>
    <!-- ============================================================= -->
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="shortcut icon" href="https://respyr.in/fav.svg" type="image/x-icon" />
    <title>Respyr Portal</title>

    <!-- ========== All CSS files linkup ========= -->
    <link rel="stylesheet" href="assets/css/bootstrap.min.css" />
    <link rel="stylesheet" href="assets/css/lineicons.css" rel="stylesheet" type="text/css" />
    <link rel="stylesheet" href="assets/css/materialdesignicons.min.css" rel="stylesheet" type="text/css" />
    <link rel="stylesheet" href="assets/css/fullcalendar.css" />
    <link rel="stylesheet" href="assets/css/fullcalendar.css" />
    <link rel="stylesheet" href="assets/css/main.css" />
    <link rel="stylesheet" href="assets/css/style.css?v=2" />
    <link rel="stylesheet" href="assets/css/responsive.css" />
    <link rel="stylesheet" href="https://cdn.datatables.net/2.3.0/css/dataTables.dataTables.css" />

  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
  <link rel="stylesheet" href="assets/css/respyr-polish.css?v=106" />

  </head>

