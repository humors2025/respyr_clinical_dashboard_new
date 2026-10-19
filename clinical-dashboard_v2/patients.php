<!DOCTYPE html>
<html lang="en">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
        integrity="sha512-Evv84Mr4kqVGRNSgIGL/F/aIDqQb7xQ2vcrdIwxfjThSH8CSR7PBEakCr51Ck+w+/U6swU2Im1vVX0SVk9ABhg=="
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
    />
    <link rel="stylesheet" href="https://unpkg.com/tippy.js@6/dist/tippy.css" />
    <script src="https://unpkg.com/@popperjs/core@2"></script>
    <script src="https://unpkg.com/tippy.js@6"></script>

    <?php include "head.php"; ?>

    <style>
        .error_wrappper {
            padding: 3rem 0px;
            display: none;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        .error_wrappper h3 {
            font-weight: 600;
        }
        .error_wrappper p {
            max-width: 350px;
            text-align: center;
        }
        .badge {
            padding: 6px 15px;
        }
        .badge-primary {
            background-color: #252525;
        }
        .badge-danger {
            background-color: red;
        }

        .td-more {
            display: flex;
            align-items:center;
            gap: 20px;
        }
        .td-more i {
            font-size: 18px;
            cursor: pointer;
        }

        .tooltip {
            position: relative;
            display: inline-block;
            cursor: pointer;
        }

        .tooltip .tooltiptext {
            visibility: hidden;
            width: 140px;
            background-color: black;
            color: #fff;
            text-align: center;
            border-radius: 5px;
            padding: 6px;
            position: absolute;
            z-index: 1;
            bottom: 125%; /* Show above the element */
            left: 50%;
            transform: translateX(-50%);
            opacity: 0;
            transition: opacity 0.3s;
        }

        .tooltip:hover .tooltiptext {
            visibility: visible;
            opacity: 1;
        }

        /* Custom Tippy.js theme */
        .tippy-box[data-theme~="custom"] {
            background-color: #fff;
            color: #333;
            font-size: 14px;
            padding: 6px 10px;
            border-radius: 6px;
            box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.2);
        }

        .tippy-box[data-theme~="custom"][data-placement^="top"] > .tippy-arrow::before {
            border-top-color: #fff;
        }

        label {
            font-weight: 600;
        }




.onboarded-subjects table { 
	border-collapse: collapse; 
	margin:50px auto;
  width: 100%;
  table-layout: fixed;
	}


@media 
only screen and (max-width: 760px),
(min-device-width: 768px) and (max-device-width: 1024px)  {

	.onboarded-subjects table { 
	  	width: 100%; 
	}

	/* Force table to not be like tables anymore */
	.onboarded-subjects table, thead, tbody, th, td, tr { 
		display: block; 
   
	}
	
	/* Hide table headers (but not display: none;, for accessibility) */
	.onboarded-subjects thead tr { 
		position: absolute;
		top: -9999px;
		left: -9999px;
	}


	
	.onboarded-subjects tr { border: 1px solid #ccc; }
	
	.onboarded-subjects td { 
		/* Behave  like a "row" */
		border: none;
		border-bottom: 1px solid #eee; 
		position: relative;
		padding-left: 50%; 
	}

	.onboarded-subjects td:before { 
		/* Now like a table header */
		position: absolute;
		/* Top/left values mimic padding */
		top: 6px;
		left: 6px;
		width: 45%; 
		padding-right: 10px; 
		white-space: nowrap;
		/* Label the data */
		content: attr(data-column);

		color: #000;
		font-weight: bold;
	}

}
















    </style>
    <body>
        <script>if (!localStorage.getItem("jwt_token")) location.href = "../clinical-v2/";</script>
        <?php include "./pages/sidebar.php" ?>
        <main class="main-wrapper">
            <?php $showHeaderSearch = true; $headerSearchPlaceholder = "Search subjects..."; include "pages/header_no_date.php" ?>









            <!-- Same shell as history.php so the two list pages match:
                 page heading, full-width gutters, one carded table. -->
            <section class="section onboarded-subjects">
                <div class="container-fluid rsp-pagewrap">
                    <!-- same heading component the rest of the site uses
                         (.rsp-pagehead on admin-profile / view-profile) -->
                    <div class="rsp-pagehead">
                        <h1 class="rsp-pagetitle">Subjects</h1>
                        <p class="rsp-pagesub" id="pageSub">Everyone onboarded at this clinic</p>
                    </div>

                    <div class="row">
                        <div class="col-lg-12">
                            <div class="card-style mb-30">
                                <div class="table-wrapper is-loading" id="subjectsContainer">
                                    <!-- shown until the first response lands, so the page never
                                         flashes "No subjects found" while it is still loading -->
                                    <p id="subjectsLoading" class="rsp-loading">Loading subjects…</p>
                                    <div id="noDataMessage" class="error_wrappper" style="display:none">
                                        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M42.7096 42.7096L55.2096 55.2096M55.2096 42.7096L42.7096 55.2096M70.3888 70.5013L83.2221 83.3346M79.168 47.918C79.168 56.206 75.8756 64.1545 70.0151 70.0151C64.1545 75.8756 56.206 79.168 47.918 79.168C39.63 79.168 31.6814 75.8756 25.8209 70.0151C19.9604 64.1545 16.668 56.206 16.668 47.918C16.668 39.63 19.9604 31.6814 25.8209 25.8209C31.6814 19.9604 39.63 16.668 47.918 16.668C56.206 16.668 64.1545 19.9604 70.0151 25.8209C75.8756 31.6814 79.168 39.63 79.168 47.918Z"
                                                stroke="#8B8891"
                                                stroke-width="1.5"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                            />
                                        </svg>

                                        <h3>No subjects found</h3>
                                        <p>Please create subjects and begin the tests. You can create subjects using the Respyr app.</p>
                                    </div>

                                    <table class="table" id="patientTable" style="display: none;">
                                        <thead>
                                            <tr>
                                                <th>Subject id</th>
                                                <th>Subject Name</th>
                                                <th>Tests Taken</th>
                                                <th>Created on</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <!-- Data will be inserted here -->
                                        </tbody>
                                    </table>
                                </div>
                                <div id="subjectsPager" class="rsp-pager" style="display:none"></div>
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
    </body>
</html>
<script src="https://cdn.jsdelivr.net/npm/jwt-decode@3/build/jwt-decode.min.js"></script>

<script src="https://cdn.jsdelivr.net/npm/jwt-decode@3/build/jwt-decode.min.js"></script>

<script src="https://cdn.jsdelivr.net/npm/jwt-decode@3/build/jwt-decode.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<!-- jQuery -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>

<!-- jQuery UI -->
<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css" />
<script src="https://code.jquery.com/ui/1.13.2/jquery-ui.min.js"></script>

<!-- <a href="https://portal.respyr.in/clinical-dashboard/view-profile.php?login_id=${item.clinic_name}&profile_id=${item.subject_id}" class="badge badge-primary"> Manage profile</a> -->

<!-- Modal -->
<div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h1 class="modal-title fs-5" id="exampleModalLabel">Edit profile</h1>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body">
                <form id="editProfileForm">
                    <div class="rsp-form-grid-2">
                        <div>
                            <label for="name" class="form-label">Profile name</label>
                            <input type="text" class="form-control" id="name" disabled />
                        </div>
                        <div>
                            <label for="gender" class="form-label">Gender</label>
                            <select class="form-select" id="gender" disabled>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                    </div>
                    <p class="rsp-form-hint"><i class="fa-solid fa-lock"></i> Name and gender can't be changed.</p>

                    <div class="rsp-form-grid-3">
                        <div>
                            <label for="age" class="form-label">Age</label>
                            <input type="number" class="form-control" id="age" min="1" max="120" step="1" required />
                        </div>
                        <div>
                            <label for="height" class="form-label">Height (cm)</label>
                            <input type="number" class="form-control" id="height" min="50" max="250" step="0.1" required />
                        </div>
                        <div>
                            <label for="weight" class="form-label">Weight (kg)</label>
                            <input type="number" class="form-control" id="weight" min="2" max="300" step="0.1" required />
                        </div>
                    </div>

                    <!-- Hidden field for subject ID -->
                    <input type="hidden" id="subject_id" />
                </form>
            </div>

            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="rsp-btn-dark" id="saveChangesBtn" disabled onclick="saveProfileChanges()">Save changes</button>
            </div>
        </div>
    </div>
</div>

<!-- Toast Container -->
<div class="position-fixed bottom-0 end-0 p-3" style="z-index: 9999;">
    <div id="profileToast" class="toast align-items-center border-0 text-bg-primary" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
            <div class="toast-body d-flex align-items-center gap-2">
                <i id="toastIcon" class="fa-solid fa-circle-check"></i>
                <span id="toastMessage">Profile updated successfully!</span>
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    </div>
</div>

<div class="modal fade" id="confirmDeleteModal" tabindex="-1" aria-labelledby="confirmDeleteModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="confirmDeleteModalLabel">Confirm Delete</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body">
                Are you sure you want to delete the profile <strong id="profileNameInModal"></strong>?
                <p>All history of this profile will be removed permanently.</p>
                <input type="hidden" id="deleteProfileId" />
                <input type="hidden" id="deleteLoginId" />
                <input type="hidden" id="deleteProfileName" />
            </div>

            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
            </div>
        </div>
    </div>
</div>

<script>

 function logout() {
    localStorage.removeItem("jwt_token");
    window.location.href = "../clinical-v2/";
  }



    document.addEventListener("DOMContentLoaded", function () {
        const clinicName = localStorage.getItem("login_id");

document.getElementById("welcome2").textContent = `Welcome, ${clinicName}!`;
        

        const table = document.getElementById("patientTable");
        const tableBody = table.querySelector("tbody");
        const messageBox = document.getElementById("noDataMessage");
        const searchInput = document.getElementById("search");

        let originalData = [];

        // Subjects come from the LOCAL Node backend — paginated and searched
        // server-side, 20 per page, so the page stays fast at any clinic size.
        const PAGE_LIMIT = 20;
        let curPage = 1;
        let curSearch = "";
        const pagerEl = document.getElementById("subjectsPager");

        function renderPager(page, limit, total) {
            if (!pagerEl) return;
            const pages = Math.max(1, Math.ceil(total / limit));
            const from = total === 0 ? 0 : (page - 1) * limit + 1;
            const to = Math.min(total, page * limit);
            pagerEl.style.display = total > 0 ? "flex" : "none";
            pagerEl.innerHTML = `
              <span class="rsp-pager-info">Showing ${from}–${to} of ${total} subjects</span>
              <div class="rsp-pager-controls">
                <button class="rsp-page-btn" ${page <= 1 ? "disabled" : ""} data-go="${page - 1}"><i class="fa-solid fa-chevron-left"></i></button>
                <span class="rsp-pager-page">Page ${page} of ${pages}</span>
                <button class="rsp-page-btn" ${page >= pages ? "disabled" : ""} data-go="${page + 1}"><i class="fa-solid fa-chevron-right"></i></button>
              </div>`;
            pagerEl.querySelectorAll(".rsp-page-btn").forEach((b) =>
                b.addEventListener("click", () => { curPage = parseInt(b.dataset.go, 10); loadSubjects(); })
            );
        }

        // only the newest request may paint (see data_table.php for the same guard)
        let subjectsReqId = 0;

        function hideLoading() {
            const el = document.getElementById("subjectsLoading");
            if (el) el.style.display = "none";
            // the desktop rule forces display:table, so the empty header row would
            // otherwise sit under the loading line — drop the class instead
            const box = document.getElementById("subjectsContainer");
            if (box) box.classList.remove("is-loading");
        }

        function loadSubjects() {
            const myReq = ++subjectsReqId;
            fetch(`${window.NODE_API}/api/dashboard/subjects`, {
                method: "POST",
                headers: window.authHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify({ clinic_name: clinicName, page: curPage, limit: PAGE_LIMIT, search: curSearch }),
            })
                .then((res) => {
                    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
                    return res.json();
                })
                .then((resp) => {
                    if (myReq !== subjectsReqId) return; // a newer search/page won
                    hideLoading();
                    tableBody.innerHTML = "";
                    const data = resp && Array.isArray(resp.data) ? resp.data : [];

                    if (data.length > 0) {
                        originalData = data;
                        renderTable(data);
                        table.style.display = "table";
                        messageBox.style.display = "none";
                    } else {
                        table.style.display = "none";
                        messageBox.querySelector("h3").textContent = curSearch
                            ? "No subjects match your search"
                            : "No subjects found";
                        messageBox.style.display = "flex";
                    }
                    renderPager(resp.page || 1, resp.limit || PAGE_LIMIT, resp.total || 0);
                    // live count under the page heading
                    const sub = document.getElementById("pageSub");
                    if (sub) {
                        const n = resp.total || 0;
                        const word = n === 1 ? "subject" : "subjects";
                        sub.textContent = curSearch
                            ? n + " matching " + word
                            : n + " " + word + " onboarded at this clinic";
                    }
                })
                .catch((err) => {
                    if (myReq !== subjectsReqId) return;
                    console.error("API Error:", err);
                    hideLoading();
                    table.style.display = "none";
                    messageBox.querySelector("h3").textContent = "Could not load subjects";
                    messageBox.querySelector("p").textContent = "Please check your connection and try again.";
                    messageBox.style.display = "flex";
                });
        }

        loadSubjects();

        // Subject names come from the mobile app — untrusted. Escape before
        // building row HTML (they also land inside attributes here).
        function esc(v) {
            return String(v ?? "").replace(/[&<>"']/g, (c) =>
                ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
        }

        function renderTable(data) {
            tableBody.innerHTML = "";
            data.forEach((item) => {
                // a null or malformed dttm used to throw here, and because the
                // throw happened inside the fetch .then it surfaced as
                // "No subjects found" for the whole clinic
                const date = item.dttm ? new Date(String(item.dttm).replace(" ", "T")) : null;
                const formatted = date && !isNaN(date.getTime())
                    ? `${String(date.getDate()).padStart(2, "0")} ${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()} ${date
                        .toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
                        .toLowerCase()}`
                    : "—";

                const row = document.createElement("tr");
                row.innerHTML = `
        <td data-column="Subject id"   >${esc(item.subject_id)}</td>
        <td data-column="Subject name" >${esc(item.profile_name)}</td>
        <td data-column="Tests Taken"  >${item.count_taken ?? 0}</td>
        <td data-column="Created on"  >${formatted}</td>
        <td data-column="Action"   class="td-more">
          <button type="button" style="display:none"  class="btn btn-transperent delete-btn"
            data-bs-toggle="modal" data-bs-target="#confirmDeleteModal"
            data-profile-name="${esc(item.profile_name)}"
            data-profile-id="${esc(item.subject_id)}"
            data-login-id="${esc(clinicName)}">
            <i class="fa-solid fa-trash-can text-danger" title="Delete ${esc(item.profile_name)}"></i>
          </button>

          <button type="button" class="btn btn-transperent edit-btn"
            data-tip="Edit details"
            data-bs-toggle="modal" data-bs-target="#exampleModal"
            data-id="${esc(item.subject_id)}"
            data-name="${esc(item.profile_name)}"
            data-gender="${esc(item.gender)}"
            data-age="${esc(item.age)}"
            data-height="${esc(item.height)}"
            data-weight="${esc(item.weight)}">
            <i class="fa-solid fa-pen-to-square text-primary" ></i>
          </button>

          <a data-tip="View profile" href="./view-profile.php?login_id=${encodeURIComponent(item.clinic_name)}&profile_id=${encodeURIComponent(item.subject_id)}&name=${encodeURIComponent(item.profile_name)}">
            <i class="fa-solid fa-user text-primary"></i>
          </a>
        </td>`;
                tableBody.appendChild(row);
            });
        }

        // Search is server-side now (covers ALL subjects, not just the loaded
        // page), debounced so we don't fire a request per keystroke.
        if (searchInput) {
            let searchTimer = null;
            searchInput.addEventListener("input", function () {
                clearTimeout(searchTimer);
                const q = this.value.trim();
                searchTimer = setTimeout(() => {
                    curSearch = q;
                    curPage = 1;
                    loadSubjects();
                }, 350);
            });
        }

        // Tooltips
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltipTriggerList.forEach((el) => new bootstrap.Tooltip(el));
    });

    // Edit Modal Logic
    let originalData = {};
    document.addEventListener("click", function (e) {
        const btn = e.target.closest(".edit-btn");
        if (btn) {
            const id = btn.getAttribute("data-id");
            const name = btn.getAttribute("data-name");
            const gender = btn.getAttribute("data-gender");
            const age = btn.getAttribute("data-age");
            const height = btn.getAttribute("data-height");
            const weight = btn.getAttribute("data-weight");

            document.getElementById("exampleModalLabel").textContent = `Edit profile: ${name}`;
            document.getElementById("name").value = name;
            document.getElementById("age").value = age;
            document.getElementById("height").value = height;
            document.getElementById("weight").value = weight;
            document.getElementById("gender").value = gender;
            document.getElementById("subject_id").value = id;

            originalData = { age, height, weight };
            document.getElementById("saveChangesBtn").disabled = true;
        }
    });

    function checkChanges() {
        const age = document.getElementById("age").value;
        const height = document.getElementById("height").value;
        const weight = document.getElementById("weight").value;
        const changed = age !== originalData.age || height !== originalData.height || weight !== originalData.weight;
        document.getElementById("saveChangesBtn").disabled = !changed;
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("age").addEventListener("input", checkChanges);
        document.getElementById("height").addEventListener("input", checkChanges);
        document.getElementById("weight").addEventListener("input", checkChanges);
    });

    // Save Profile Changes
    function showToast(message, isSuccess = true) {
        const toastEl = document.getElementById("profileToast");
        const toastBody = document.getElementById("toastMessage");
        const toastIcon = document.getElementById("toastIcon");

        toastBody.textContent = message;
        toastEl.classList.remove("text-bg-primary", "text-bg-danger");
        toastEl.classList.add(isSuccess ? "text-bg-primary" : "text-bg-danger");
        toastIcon.className = isSuccess ? "fa-solid fa-circle-check" : "fa-solid fa-circle-xmark";

        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }

    function saveProfileChanges() {
        const login_id = localStorage.getItem("login_id");
        const profile_id = document.getElementById("subject_id").value;
        const ageEl = document.getElementById("age");
        const heightEl = document.getElementById("height");
        const weightEl = document.getElementById("weight");

        // the inputs carry min/max bounds — refuse to save anything outside them
        for (const el of [ageEl, heightEl, weightEl]) {
            if (!el.checkValidity()) {
                el.reportValidity();
                return;
            }
        }

        const age = ageEl.value;
        const height = heightEl.value;
        const weight = weightEl.value;

        const btn = document.getElementById("saveChangesBtn");
        btn.disabled = true;
        btn.textContent = "Saving...";

        fetch(`${window.NODE_API}/api/profiles/update`, {
            method: "POST",
            headers: window.authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ login_id, profile_id, age, height, weight }),
        })
            .then((res) => res.json())
            .then((data) => {
                btn.textContent = "Save changes";
                btn.disabled = false;
                if (data.status === "success") {
                    showToast("✅ " + data.message, true);
                    setTimeout(() => location.reload(), 2000);
                } else {
                    showToast("⚠️ " + data.message, false);
                }
            })
            .catch((err) => {
                console.error("Update error:", err);
                btn.textContent = "Save changes";
                btn.disabled = false;
                showToast("❌ Something went wrong. Please try again.", false);
            });
    }

    // Delete Modal Logic
    const deleteModal = document.getElementById("confirmDeleteModal");
    deleteModal.addEventListener("show.bs.modal", function (event) {
        const button = event.relatedTarget;
        const profileName = button.getAttribute("data-profile-name");
        const profileId = button.getAttribute("data-profile-id");
        const loginId = button.getAttribute("data-login-id");

        document.getElementById("profileNameInModal").textContent = profileName;
        document.getElementById("deleteProfileId").value = profileId;
        document.getElementById("deleteLoginId").value = loginId;
        document.getElementById("deleteProfileName").value = profileName;
    });

    document.getElementById("confirmDeleteBtn").addEventListener("click", function () {
        const profileId = document.getElementById("deleteProfileId").value;
        const loginId = localStorage.getItem("login_id"); // Directly use
        const profileName = decodeURIComponent(document.getElementById("deleteProfileName").value);

        fetch(`${window.NODE_API}/api/profiles/delete`, {
            method: "POST",
            headers: window.authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ login_id: loginId, profile_id: profileId, name: profileName }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.status === "success") {
                    showToast(`✅ ${profileName} has been deleted successfully.`, true);
                    setTimeout(() => location.reload(), 1500);
                } else {
                    showToast(`❌ ${data.message || "Failed to delete profile."}`, false);
                }
            })
            .catch((err) => {
                showToast("❌ Error occurred: " + err.message, false);
            });

        const modal = bootstrap.Modal.getInstance(deleteModal);
        modal.hide();
    });
</script>

