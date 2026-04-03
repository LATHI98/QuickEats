const API_URL = 'http://127.0.0.1:5000/api';

async function verifyGroupOrder() {
    console.log('--- STARTING GROUP ORDER VERIFICATION (Coordinated Submission) ---');
    
    // 1. Log in Creator & Member
    const creator = await login('student@quickeats.com', 'student123');
    const member = await login('student-2@quickeats.com', 'student123'); 

    if (!creator.token || !member.token) {
        console.error('Login failed. Ensure student and student2 exist.');
        return;
    }

    // 2. Clear Carts
    await apiCall('/cart', 'DELETE', null, creator.token);
    await apiCall('/cart', 'DELETE', null, member.token);

    // 3. Create Group Session (Creator)
    const canteenId = '69a92b15bc690899d98f0538'; 
    const sessionRes = await apiCall('/group-sessions', 'POST', { 
        canteenId, 
        paymentMode: 'pay_separately', 
        name: 'Automation Test Group' 
    }, creator.token);
    const session = sessionRes.data;
    console.log('Session Created:', session.shareCode);

    // 4. Join Session (Member)
    await apiCall('/group-sessions/join', 'POST', { shareCode: session.shareCode }, member.token);
    console.log('Member Joined');

    // 5. Add Items to Carts
    const menuItemId = '69a92b15bc690899d98f053f'; 
    await apiCall('/cart/items', 'POST', { menuItemId, quantity: 2 }, creator.token);
    await apiCall('/cart/items', 'POST', { menuItemId, quantity: 1 }, member.token);
    console.log('Items Added');

    // 6. Lock Session
    await apiCall(`/group-sessions/${session._id}/lock`, 'PATCH', {}, creator.token);
    console.log('Session Locked');

    // 7. Verify Member Status (Readiness)
    const statusRes = await apiCall(`/group-sessions/${session._id}/member-status`, 'GET', null, creator.token);
    console.log('Member Readiness:', statusRes.data.map(m => `${m.name}: ${m.hasItems ? 'READY' : 'EMPTY'}`));

    // 8. Place Group Order (Coordinated)
    console.log('Placing Group Orders...');
    const orderRes = await apiCall('/orders', 'POST', {
        groupSessionId: session._id,
        submitGroup: true,
        instantPickup: true
    }, creator.token);

    if (orderRes.success) {
        console.log('SUCCESS:', orderRes.message);
        console.log('Total Orders Created:', orderRes.allOrders.length);
        orderRes.allOrders.forEach(o => {
            console.log(`- Order for student ID ${o.student}: Queue #${o.queueNumber}, Total: LKR ${o.totalPrice}`);
        });
    } else {
        console.error('FAILED:', orderRes.message);
    }
}

async function login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'student' })
    });
    const data = await res.json();
    return { token: data.token, user: data.user };
}

async function apiCall(endpoint, method, body, token) {
    const options = {
        method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${API_URL}${endpoint}`, options);
    return await res.json();
}

verifyGroupOrder();
