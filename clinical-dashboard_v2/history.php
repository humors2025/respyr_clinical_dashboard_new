<!DOCTYPE html>
<html lang="en">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

    <?php include "head.php"; ?>
    <body>
        <?php include "./pages/sidebar.php" ?>
        <main class="main-wrapper">


 <?php $showHeaderSearch = true; $headerSearchPlaceholder = "Search subjects..."; include "pages/header_no_date.php" ?>

            <!-- <button id="captureBtn">Capture Full Page</button> -->

            <section class="section">
                <div class="container-fluid rsp-pagewrap">
                    <div class="row pt-30" style="display: none;">
                        <div class="col-xl-4 col-lg-4 col-sm-6">
                            <div class="icon-card card-first mb-30">
                                <div class="caldender-container">
                                    <p class="current-date">
                                        <?php
                                            date_default_timezone_set('Asia/Kolkata');
                                            echo date('d');
                                            ?>
                                                            </p>
                                    <div class="current-month">
                                        <p><?php  echo date('M');?></p>
                                    </div>
                                </div>
                                <div class="patients-container">
                                    <p class="numbers" id="dataCount">NA</p>
                                    <p class="text">Subjects taken test</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-5 col-lg-4 col-sm-6">
                            <div class="icon-card mb-30 card-patients-data">
                                <div class="dropdown">
                                    <button class="btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        Sugar score
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li><a class="dropdown-item" href="#">Sugar score</a></li>
                                        <li><a class="dropdown-item" href="#">Liver score</a></li>
                                        <li><a class="dropdown-item" href="#">Respiratory score</a></li>
                                        <li><a class="dropdown-item" href="#">Gut score</a></li>
                                    </ul>
                                </div>
                                <div class="patients-data-wrapper">
                                    <div class="patients-wrapper good">
                                        <h3 class="value" id="goodCount">12</h3>
                                        <h4>Subjects</h4>
                                        <h5>Good score</h5>
                                    </div>

                                    <div class="patients-wrapper fair">
                                        <h3 class="value" id="fairCount">14</h3>
                                        <h4>Subjects</h4>
                                        <h5>Fair score</h5>
                                    </div>

                                    <div class="patients-wrapper poor">
                                        <h3 class="value" id="poorCount">15</h3>
                                        <h4>Subjects</h4>
                                        <h5>Poor score</h5>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-3 col-lg-4 col-sm-6">
                            <div class="icon-card mb-30">
                                <div style="width: 120px; height: 120px;">
                                    <canvas id="genderChart"></canvas>
                                </div>
                                <div></div>
                            </div>
                        </div>
                    </div>

                    <!-- same heading component the rest of the site uses
                         (.rsp-pagehead on admin-profile / view-profile) -->
                    <div class="rsp-pagehead">
                        <h1 class="rsp-pagetitle">Test Logs</h1>
                        <p class="rsp-pagesub" id="pageSub">The most recent test for each subject</p>
                    </div>

                    <div class="row">
                        <div class="col-lg-12">
                            <div class="card-style mb-30">
                                <div class="table-wrapper">
                                    <?php include "data_table.php"; ?>
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
            // #captureBtn is commented out above, so this guard is what stops a
            // TypeError on every page load.
            document.getElementById("captureBtn")?.addEventListener("click", function () {
                html2canvas(document.body, {
                    scale: 2, // higher resolution
                    scrollY: -window.scrollY, // ensure top alignment
                }).then((canvas) => {
                    const link = document.createElement("a");
                    link.download = "full-page-screenshot.png";
                    link.href = canvas.toDataURL("image/png");
                    link.click();
                });
            });
        </script>
    </body>
</html>

