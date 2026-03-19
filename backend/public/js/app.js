// app.js
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
        view.classList.add('hidden');
    });

    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }

    const header = document.getElementById('app-header');
    const banner = document.getElementById('monitoring-banner');
    const bottomNav = document.getElementById('bottom-nav');
    
    // Header logic
    if(viewId === 'view-login') {
        if(header) header.style.display = 'none';
        if(banner) banner.classList.remove('active');
        if(bottomNav) bottomNav.classList.add('hidden');
    } else {
        if(header) header.style.display = 'flex';
        if(banner) banner.classList.add('active');
        if(bottomNav && (viewId === 'view-student' || viewId === 'view-tutor')) {
             bottomNav.classList.remove('hidden');
        } else if (bottomNav) {
             bottomNav.classList.add('hidden');
        }
    }
}

window.AppTools = { switchView };
