window.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('login-form');
  const errorDiv = document.getElementById('login-error');
  let accessToken = null; // Vẫn có thể giữ token tạm trong RAM nếu muốn

  if (!form) return console.error('Không tìm thấy form!');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
      errorDiv.textContent = 'Email và mật khẩu không được để trống.';
      errorDiv.classList.remove('hidden');
      return;
    }

    fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Để gửi kèm refresh token dạng cookie
      body: JSON.stringify({ email, password })
    })
    .then(response => {
      if (!response.ok) throw new Error('Sai email hoặc mật khẩu');
      return response.json();
    })
    .then(data => {
      accessToken = data.access;

      // 🔄 Chuyển từ sessionStorage sang localStorage
      localStorage.setItem('accessToken', accessToken);

      // Reset bộ đếm khi đăng nhập thành công
      localStorage.removeItem('loginFailCount');
      localStorage.removeItem('loginFailTimestamp');

      window.location.href = 'http://localhost:3000/';
    })
    .catch(error => {
      document.getElementById('password').value = '';

      let failCount = parseInt(localStorage.getItem('loginFailCount') || '0');
      let lastFailTime = parseInt(localStorage.getItem('loginFailTimestamp') || '0');
      let now = Date.now();

      // Reset đếm lỗi sau 15 phút
      if (now - lastFailTime > 15 * 60 * 1000) {
        failCount = 0;
      }

      failCount += 1;
      localStorage.setItem('loginFailCount', failCount);
      localStorage.setItem('loginFailTimestamp', now);

      if (failCount >= 7) {
        window.location.href = '/locked';
      } else {
        errorDiv.textContent = `${error.message} (Thử lại lần ${failCount}/7)`;
        errorDiv.classList.remove('hidden');
      }
    });
  });

  // Google login redirect
  const google_id = '337443264476-9kc3budl5faen2679fandvc6u305iu9q.apps.googleusercontent.com';
  const redirectUri = 'http://localhost:3000/google/callback/';
  const google_redirect = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${google_id}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20email%20profile&access_type=offline&prompt=consent`;


  window.loginWithGoogle = function () {
    window.location.href = google_redirect;
  };
});
