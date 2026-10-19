<footer class="footer">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-6 order-last order-md-first">
                <div class="copyright text-center text-md-start">
                    <p class="text-sm">
                        Designed and Developed by
                        <a href="https://humorstech.com" target="_blank" rel="noopener">
                            Humorstech Pvt Ltd
                        </a>
                    </p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="terms d-flex justify-content-center justify-content-md-end">
                    <a href="https://respyr.in/terms-conditions/" class="text-sm" target="_blank" rel="noopener">Terms &amp; Conditions</a>
                    <a href="https://respyr.in/privacy_policy/" class="text-sm ml-15" target="_blank" rel="noopener">Privacy Policy</a>
                </div>
            </div>
        </div>
    </div>
</footer>

<!-- In-page report dialog: openReportModal(url) loads the report in an
     iframe overlay instead of navigating away. Esc / backdrop / × close it. -->
<div class="rsp-repmodal" id="rspRepModal" hidden>
    <div class="rsp-repmodal-back"></div>
    <div class="rsp-repmodal-card" role="dialog" aria-modal="true" aria-label="Test report">
        <div class="rsp-repmodal-head">
            <span class="rsp-repmodal-title">Test report</span>
            <div class="rsp-repmodal-actions">
                <button type="button" id="rspRepDl" class="rsp-repmodal-btn dark" disabled><i class="fa-solid fa-download"></i>Download pdf</button>
                <button type="button" id="rspRepSend" class="rsp-repmodal-btn blue" disabled><i class="fa-solid fa-envelope"></i>Send pdf</button>
                <a id="rspRepOpenTab" href="#" target="_blank" rel="noopener" title="Open full page"><i class="fa-solid fa-up-right-from-square"></i></a>
                <button type="button" id="rspRepClose" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
            </div>
        </div>
        <div class="rsp-repmodal-body"><iframe id="rspRepFrame" title="Test report"></iframe></div>
    </div>
</div>
<script>
    (function () {
        const modal = document.getElementById("rspRepModal");
        const frame = document.getElementById("rspRepFrame");
        const tabLink = document.getElementById("rspRepOpenTab");

        // The report is a fixed ~840px A4 document; on narrower dialogs it is
        // zoomed down so the whole page width is visible without h-scrolling.
        function fit() {
            const body = modal.querySelector(".rsp-repmodal-body");
            const w = body.clientWidth;
            frame.style.zoom = w < 860 ? (w / 860) : 1;
        }

        // Download / Send live in the report page — the header buttons just
        // forward the click into the iframe once it has loaded.
        const dlBtn = document.getElementById("rspRepDl");
        const sendBtn = document.getElementById("rspRepSend");
        function proxyClick(id) {
            try {
                const doc = frame.contentDocument;
                const b = doc && doc.getElementById(id);
                if (b) b.click();
            } catch (e) {}
        }
        dlBtn.addEventListener("click", () => proxyClick("downloadBtn"));
        sendBtn.addEventListener("click", () => proxyClick("emailBtn"));
        frame.addEventListener("load", () => {
            const ready = frame.src && frame.src.indexOf("about:blank") === -1;
            dlBtn.disabled = !ready;
            sendBtn.disabled = !ready;
        });

        window.openReportModal = function (url) {
            dlBtn.disabled = true;
            sendBtn.disabled = true;
            frame.src = url;
            tabLink.href = url;
            modal.hidden = false;
            document.body.classList.add("rsp-repmodal-open");
            fit();
        };

        function close() {
            // Blanking the iframe kills an in-flight PDF build or email send,
            // which used to happen silently. Ask first if the report says it is busy.
            let busy = false;
            try { busy = !!(frame.contentWindow && frame.contentWindow.rspReportBusy); } catch (e) { /* cross-doc */ }
            if (busy && !confirm("A report is still being sent. Close anyway and cancel it?")) return;

            modal.hidden = true;
            document.body.classList.remove("rsp-repmodal-open");
            frame.src = "about:blank"; // stop any in-flight report work
        }

        modal.querySelector(".rsp-repmodal-back").addEventListener("click", close);
        document.getElementById("rspRepClose").addEventListener("click", close);
        document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) close(); });
        window.addEventListener("resize", () => { if (!modal.hidden) fit(); });
    })();
</script>
