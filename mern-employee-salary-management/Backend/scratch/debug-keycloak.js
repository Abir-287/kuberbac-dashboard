import axios from 'axios';

const KEYCLOAK_URL = "https://192.168.122.235:8443";
const REALM = "kubernetes";
const ADMIN_USER = "admin";
const ADMIN_PASS = "Admin123!";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function getAdminToken() {
    try {
        const params = new URLSearchParams();
        params.append('client_id', 'admin-cli');
        params.append('username', ADMIN_USER);
        params.append('password', ADMIN_PASS);
        params.append('grant_type', 'password');

        const res = await axios.post(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, params);
        return res.data.access_token;
    } catch (e) {
        console.error("Failed to get Keycloak Admin Token:", e.message);
        return null;
    }
}

async function debug() {
    const token = await getAdminToken();
    if (!token) return;

    try {
        const res = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const keycloakUsers = res.data;
        console.log(`Found ${keycloakUsers.length} users:`);

        for (const user of keycloakUsers) {
            const groupsRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${user.id}/groups`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`- User: ${user.username}, Email: ${user.email}, Groups: ${groupsRes.data.map(g => g.name).join(', ')}`);
        }
    } catch (e) {
        console.error("Debug Error:", e.message);
    }
}

debug();
