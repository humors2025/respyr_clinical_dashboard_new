<script src="https://cdn.jsdelivr.net/npm/vanillajs-datepicker@1.3.4/dist/js/datepicker-full.min.js"></script>



 // Format today's date as dd-mm-yyyy
  function getTodayDate() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  const input = document.getElementById('dateInput');
  const datepicker = new Datepicker(input, {
    format: 'dd-mm-yyyy',
    autohide: true,
    todayHighlight: true
  });

  // Set today's date on load
  const today = new Date();
  datepicker.setDate(today);
  document.getElementById('selected-date-output').textContent = 'Selected Date: ' + getTodayDate();

  // On date change
  input.addEventListener('changeDate', function (e) {
    const selected = input.value;
    console.log("Selected Date:", selected);
    document.getElementById('selected-date-output').textContent = 'Selected Date: ' + selected;
  });
