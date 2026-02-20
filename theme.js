document.addEventListener('DOMContentLoaded', () => {
    const themeBtns = document.querySelectorAll('.theme-toggle');
    const root = document.documentElement;
    
    // Check saved theme
    const savedTheme = localStorage.getItem('chronos-theme') || 'dark';
    root.setAttribute('data-theme', savedTheme);
    updateIcons(savedTheme);

    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentTheme = root.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            root.setAttribute('data-theme', newTheme);
            localStorage.setItem('chronos-theme', newTheme);
            updateIcons(newTheme);
        });
    });

    function updateIcons(theme) {
        themeBtns.forEach(btn => {
            const icon = btn.querySelector('i');
            if (!icon) return;
            icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        });
    }
});
