    // Firebase config
    const firebaseConfig = {
      apiKey: "AIzaSyABi91FzBJnma4vF_EyRVx73K2AS_kO_PI",
      authDomain: "resyrdashboard.firebaseapp.com",
      projectId: "resyrdashboard",
      storageBucket: "resyrdashboard.firebasestorage.app",
      messagingSenderId: "167675800197",
      appId: "1:167675800197:web:431cac669bcb337e9917ec",
      measurementId: "G-MZ828MJBBV",
      databaseURL: "https://resyrdashboard-default-rtdb.firebaseio.com"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    const logRef = db.ref("logs");

    const toastEl = document.getElementById('liveToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastTime = document.getElementById('toastTime');
    const toastBody = document.getElementById('toastBody');
    const toast = new bootstrap.Toast(toastEl, { autohide: false });

    const pageLoadTime = Math.floor(Date.now() / 1000);
    const selectedLoginId = localStorage.getItem("login_id");
    const activeTestToasts = new Set();

    function formatCategory(cat) {
      return (cat || '').replace(/_/g, ' ').toUpperCase();
    }

    function getTitleColorClass(category) {
      switch (category) {
        case 'profile_created':  return 'toast-title-success';
        case 'profile_removed':  return 'toast-title-danger';
        case 'test_started':     return 'toast-title-warning';
        case 'test_completed':   return 'toast-title-purple';
        default:                 return 'toast-title-primary';
      }
    }

    function showBootstrapToast(category, name) {
      const titleText = formatCategory(category);
      const time = new Date().toLocaleTimeString();
      const message = `${titleText} for ${name || 'Unknown'}`;


	console.log(message);

      // Update toast content
      toastTitle.textContent = titleText;
      toastTime.textContent = time;
      toastBody.textContent = message;

      // Reset all title color classes
      toastTitle.className = 'me-auto';
      toastTitle.classList.add(getTitleColorClass(category));

      // Toast behavior by category
      if (category === 'test_started') {
        toast.show();
        activeTestToasts.add(name);
      }
      else if (category === 'test_completed') {
        if (activeTestToasts.has(name)) {
          toast.hide();
          activeTestToasts.delete(name);

          // Delay to let previous toast close before showing test_completed
          setTimeout(() => {
            toastTitle.textContent = "TEST COMPLETED";
            toastTime.textContent = new Date().toLocaleTimeString();
            toastBody.textContent = `TEST COMPLETED for ${name || 'Unknown'}`;
            toastTitle.className = 'me-auto toast-title-purple';
            toast.show();
          }, 300);
        }
      }
      else {
        toast.show();
        setTimeout(() => toast.hide(), 3000);
      }
    }

    logRef.limitToLast(20).on("child_added", (snapshot) => {
      const data = snapshot.val();
      const logTime = data.timestamp || 0;

      if (logTime > pageLoadTime && data.login_id === selectedLoginId) {
        showBootstrapToast(data.category, data.name);
      }
    });
