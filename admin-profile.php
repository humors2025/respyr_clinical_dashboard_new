<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <!-- Font Awesome -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />

        <!-- Toast Plugin -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jquery-toast-plugin/1.3.2/jquery.toast.min.css" />

        <?php include "head.php"; ?>
    </head>
    <body>
        <script>if (!localStorage.getItem("jwt_token")) location.href = "./clinical-v2/";</script>
        <?php include "./pages/sidebar.php" ?>
        <main class="main-wrapper">
            <?php include "pages/header_no_date.php" ?>

            <section class="section new-dashboard admin-profile">
                <div class="container-fluid">

                    <div class="rsp-pagehead">
                        <h1 class="rsp-pagetitle">Clinic profile</h1>
                        <p class="rsp-pagesub">Your account details and sign-in settings.</p>
                    </div>

                    <div class="row rsp-row">
                        <div class="col-lg-4 col-12">
                            <div class="card rsp-card rsp-idcard h-100">
                                <div class="rsp-avatar rsp-avatar--xl" id="adminAvatar">?</div>
                                <h2 class="rsp-idcard-name" id="adminName">&mdash;</h2>
                                <p class="rsp-idcard-loc"><i class="fa-solid fa-location-dot"></i> <span id="adminLocation">&mdash;</span></p>
                                <span class="rsp-role-badge">Administrator</span>
                            </div>
                        </div>

                        <div class="col-lg-8 col-12">
                            <div class="card rsp-card h-100">
                                <div class="rsp-card-head">
                                    <h3 class="rsp-card-title"><i class="fa-regular fa-id-card rsp-ti"></i>Account details</h3>
                                </div>

                                <div class="rsp-inforow">
                                    <div class="rsp-inforow-ico"><i class="fa-regular fa-envelope"></i></div>
                                    <div>
                                        <p class="rsp-inforow-lbl">Registered email</p>
                                        <p class="rsp-inforow-val" id="adminEmail">&mdash;</p>
                                    </div>
                                </div>

                                <div class="rsp-inforow">
                                    <div class="rsp-inforow-ico"><i class="fa-solid fa-phone"></i></div>
                                    <div>
                                        <p class="rsp-inforow-lbl">Registered phone</p>
                                        <p class="rsp-inforow-val" id="adminPhone">&mdash;</p>
                                    </div>
                                </div>

                                <div class="rsp-inforow">
                                    <div class="rsp-inforow-ico"><i class="fa-regular fa-image"></i></div>
                                    <div>
                                        <p class="rsp-inforow-lbl">Report logo <span class="rsp-inforow-hint">&mdash; shown on every report you generate</span></p>
                                        <img id="reportLogoImg" class="rsp-report-logo" src="" alt="Clinic logo" style="display:none" />
                                        <p class="rsp-inforow-val rsp-logo-empty" id="logoEmpty" style="display:none">No logo uploaded yet</p>
                                    </div>
                                </div>

                                <div class="rsp-profile-actions">
                                    <button type="button" class="rsp-btn-dark" data-bs-toggle="modal" data-bs-target="#changePassword">
                                        <i class="fa-solid fa-key"></i> Change password
                                    </button>
                                    <button type="button" class="rsp-btn-danger-ghost" onclick="logout()">
                                        <i class="fa-solid fa-right-from-bracket"></i> Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            <?php include "footer.php"; ?>
        </main>

        <!-- Change password modal -->
        <div class="modal fade" id="changePassword" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 class="modal-title fs-5" id="exampleModalLabel">Change password</h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editProfileForm">
                            <div class="mb-3">
                                <label for="current_password" class="form-label">Current password</label>
                                <input type="password" class="form-control" id="current_password" />
                                <div id="currentPasswordError" class="text-danger mt-1" style="display: none;">Incorrect current password.</div>
                            </div>

                            <div class="mb-3">
                                <label for="password" class="form-label">New password</label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="password" />
                                    <span class="input-group-text bg-white">
                                        <i class="fa-solid fa-eye-slash" id="togglePassword" style="cursor: pointer;"></i>
                                    </span>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="confirm_password" class="form-label">Confirm new password</label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="confirm_password" />
                                    <span class="input-group-text bg-white">
                                        <i class="fa-solid fa-eye-slash" id="toggleConfirmPassword" style="cursor: pointer;"></i>
                                    </span>
                                </div>
                                <div id="confirmPasswordError" class="text-danger mt-1" style="display: none;">Passwords do not match.</div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="rsp-btn-dark" id="saveChangesBtn" disabled onclick="saveProfileChanges()">Save changes</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Scripts -->
        <script src="assets/js/bootstrap.bundle.min.js"></script>
        <script src="assets/js/main.js"></script>
        <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-toast-plugin/1.3.2/jquery.toast.min.js"></script>

        <script>
            function logout() {
                localStorage.removeItem("jwt_token");
                localStorage.removeItem("login_id");
                window.location.href = "./clinical-v2/";
            }

            document.addEventListener("DOMContentLoaded", function () {
                const clinicName = localStorage.getItem("login_id") || "";
                const w = document.getElementById("welcome2");
                if (w) w.textContent = `Welcome, ${clinicName}!`;

                // Initial-letter avatar — same palette as the test-log avatars.
                const AV_COLORS = ["#308bf9", "#3faf58", "#e48326", "#8e44ad", "#0ea5a4", "#e74c3c", "#6366f1", "#d97706"];
                const initial = (clinicName.charAt(0) || "?").toUpperCase();
                const av = AV_COLORS[(initial.charCodeAt(0) || 65) % AV_COLORS.length];
                const avatar = document.getElementById("adminAvatar");
                avatar.textContent = initial;
                avatar.style.background = av + "1a";
                avatar.style.color = av;

                // Clinic details from the Node backend.
                fetch(`${window.NODE_API}/api/dashboard/clinic-info`, {
                    method: "POST",
                    headers: window.authHeaders({ "Content-Type": "application/json" }),
                    body: JSON.stringify({ clinic_name: clinicName }),
                })
                    .then((r) => r.json())
                    .then((clinic) => {
                        document.getElementById("adminName").textContent = clinic.clinic_name || clinicName || "Admin";
                        document.getElementById("adminLocation").textContent = clinic.location || "NA";
                        document.getElementById("adminEmail").textContent = clinic.username || "-";
                        document.getElementById("adminPhone").textContent = clinic.phone_no || "-";
                    })
                    .catch(() => {
                        document.getElementById("adminName").textContent = clinicName || "Admin";
                    });

                // Report logo (URL from the Node backend; hide cleanly if none).
                const logoImg = document.getElementById("reportLogoImg");
                const logoEmpty = document.getElementById("logoEmpty");
                fetch(`${window.NODE_API}/api/clinic/logos`, {
                    method: "POST",
                    headers: window.authHeaders({ "Content-Type": "application/json" }),
                    body: JSON.stringify({ login_id: clinicName }),
                })
                    .then((r) => r.json())
                    .then((data) => {
                        const src = data?.data?.report_logo_src || data?.data?.logo_src || "";
                        if (src) {
                            logoImg.src = src;
                            logoImg.style.display = "block";
                            logoImg.onerror = () => { logoImg.style.display = "none"; logoEmpty.style.display = "block"; };
                        } else {
                            logoEmpty.style.display = "block";
                        }
                    })
                    .catch(() => { logoEmpty.style.display = "block"; });
            });

            // Toggle password visibility
            function toggleVisibility(toggleId, inputId) {
                const toggle = document.getElementById(toggleId);
                const input = document.getElementById(inputId);
                toggle.addEventListener("click", function () {
                    const isPassword = input.getAttribute("type") === "password";
                    input.setAttribute("type", isPassword ? "text" : "password");
                    this.classList.toggle("fa-eye");
                    this.classList.toggle("fa-eye-slash");
                });
            }

            toggleVisibility("togglePassword", "password");
            toggleVisibility("toggleConfirmPassword", "confirm_password");

            const currentPasswordInput = document.getElementById("current_password");
            const passwordInput = document.getElementById("password");
            const confirmInput = document.getElementById("confirm_password");
            const saveBtn = document.getElementById("saveChangesBtn");
            const currentPasswordError = document.getElementById("currentPasswordError");
            const confirmPasswordError = document.getElementById("confirmPasswordError");

            function validateAll() {
                const current = currentPasswordInput.value.trim();
                const pw = passwordInput.value.trim();
                const cpw = confirmInput.value.trim();

                if (pw && cpw && pw !== cpw) {
                    confirmInput.classList.add("is-invalid");
                    confirmPasswordError.style.display = "block";
                } else {
                    confirmInput.classList.remove("is-invalid");
                    confirmPasswordError.style.display = "none";
                }

                saveBtn.disabled = !(current && pw && cpw && pw === cpw);
            }

            currentPasswordInput.addEventListener("input", validateAll);
            passwordInput.addEventListener("input", validateAll);
            confirmInput.addEventListener("input", validateAll);

            function saveProfileChanges() {
                const current_password = currentPasswordInput.value.trim();
                const new_password = passwordInput.value.trim();
                const confirm_password = confirmInput.value.trim();
                const clinic_name = localStorage.getItem("login_id");

                if (!current_password || !new_password || new_password !== confirm_password) {
                    validateAll();
                    return;
                }

                fetch(`${window.NODE_API}/api/clinic/change-password`, {
                    method: "POST",
                    headers: window.authHeaders({ "Content-Type": "application/json" }),
                    body: JSON.stringify({ clinic_name, current_password, new_password }),
                })
                    .then((r) => r.json())
                    .then((data) => {
                        if (data && data.status === "success") {
                            $.toast({
                                heading: "Success",
                                text: data.message || "Password updated successfully!",
                                showHideTransition: "slide",
                                icon: "success",
                                position: "bottom-right",
                            });

                            document.getElementById("editProfileForm").reset();
                            saveBtn.disabled = true;
                            currentPasswordInput.classList.remove("is-invalid");
                            currentPasswordError.style.display = "none";
                            confirmInput.classList.remove("is-invalid");
                            confirmPasswordError.style.display = "none";

                            const modalEl = document.getElementById("changePassword");
                            const modal = bootstrap.Modal.getInstance(modalEl);
                            modal.hide();
                        } else if (data && data.status === "error" && data.message === "Incorrect current password") {
                            currentPasswordInput.classList.add("is-invalid");
                            currentPasswordError.style.display = "block";

                            $.toast({
                                heading: "Error",
                                text: "Incorrect current password.",
                                showHideTransition: "fade",
                                icon: "error",
                                position: "bottom-right",
                            });
                        } else {
                            $.toast({
                                heading: "Error",
                                text: (data && data.message) || "Password change failed.",
                                showHideTransition: "fade",
                                icon: "error",
                                position: "bottom-right",
                            });
                        }
                    })
                    .catch(() => {
                        $.toast({
                            heading: "Error",
                            text: "Network or server error. Please try again.",
                            showHideTransition: "fade",
                            icon: "error",
                            position: "bottom-right",
                        });
                    });
            }
        </script>
    </body>
</html>
