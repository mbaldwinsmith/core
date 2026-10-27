// Run before first paint; failure to access storage never prevents reading.
document.documentElement.classList.add('js');
try {
  const theme = localStorage.getItem('core-theme');
  const size = localStorage.getItem('core-text-size');
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  if (size === 'large') document.documentElement.dataset.reading = 'large';
} catch { /* Private browsing and storage restrictions are supported. */ }
