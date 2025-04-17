document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    console.log('Login form submitted'); // Debug message

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const validUser = {
        username: '20/52HA123',
        password: '12345'
    };

    if (username === validUser.username && password === validUser.password) {
        console.log('Login successful'); // Debug message
        localStorage.setItem('token', 'simulation-token');
        window.location.href = './index.html';
    } else {
        console.log('Invalid credentials'); // Debug message
        alert('Invalid credentials! Please use:\nUsername: 20/52HA123\nPassword: 12345');
    }
});