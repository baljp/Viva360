
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api';

async function testLogin() {
    console.log("Testing Client Login...");
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            email: 'client0@viva360.com',
            password: '123456' 
        })
        });
        
        const data: any = await res.json();
        console.log("Login Status:", res.status);
        if(!res.ok) {
            console.error("Login Failed:", data);
            return;
        }

        console.log("User Role:", data.user.role);
        console.log("Token:", data.session.access_token);

        const token = data.session.access_token;

        console.log("\nTesting Get Profile...");
        const resProfile = await fetch(`${API_URL}/profiles/me`, {
             headers: { 
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${token}`
             }
        });
        const profileData: any = await resProfile.json();
        console.log("Profile Status:", resProfile.status);
        console.log("Profile Role:", profileData.role);
        
        if (data.user.role !== 'CLIENT') console.error("MISMATCH! Expected 'CLIENT'");
        if (profileData.role !== 'CLIENT') console.error("PROFILE MISMATCH! Expected 'CLIENT'");

    } catch (e) {
        console.error(e);
    }
}

testLogin();
