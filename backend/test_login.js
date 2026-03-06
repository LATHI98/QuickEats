const API_URL = 'http://127.0.0.1:5000/api';

async function testLogin() {
    console.log('Testing Admin Login (role: admin)...');
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@quickeats.com',
                password: 'admin123',
                role: 'admin'
            })
        });
        const data = await res.json();
        if (res.ok) {
            console.log('Login Success:', data.user.role);
        } else {
            console.log('Login Failed:', res.status, data.message);
        }
    } catch (err) {
        console.log('Error:', err.message);
    }

    console.log('\nTesting Student Login (role: student)...');
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'student@quickeats.com',
                password: 'student123',
                role: 'student'
            })
        });
        const data = await res.json();
        if (res.ok) {
            console.log('Login Success:', data.user.role);
        } else {
            console.log('Login Failed:', res.status, data.message);
        }
    } catch (err) {
        console.log('Error:', err.message);
    }
}

testLogin();
