import axios from 'axios';
import https from 'https';

const KEYCLOAK_URL = "https://192.168.122.235:8443";
const REALM = "kubernetes";
const ADMIN_USER = "admin";
const ADMIN_PASS = "Admin123!";

const agent = new https.Agent({ rejectUnauthorized: false });

async function getAdminToken() {
    const params = new URLSearchParams();
    params.append('client_id', 'admin-cli');
    params.append('username', ADMIN_USER);
    params.append('password', ADMIN_PASS);
    params.append('grant_type', 'password');
    const res = await axios.post(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, params, { httpsAgent: agent });
    return res.data.access_token;
}

async function run() {
    try {
        const token = await getAdminToken();
        
        // Find user developer
        const usersRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=developer`, {
            headers: { Authorization: `Bearer ${token}` },
            httpsAgent: agent
        });
        const user = usersRes.data.find(u => u.username === 'developer');
        
        console.log("Resetting password for developer to 'Developer123!'");
        await axios.put(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${user.id}/reset-password`, {
            type: "password",
            value: "Developer123!",
            temporary: false
        }, {
            headers: { Authorization: `Bearer ${token}` },
            httpsAgent: agent
        });
        console.log("Password reset successful.");
    } catch (e) {
        console.error("Error:", e.message);
    }
}

run();
