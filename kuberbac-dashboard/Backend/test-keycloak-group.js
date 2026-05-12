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
        const user = usersRes.data[0];
        
        // Get groups
        const groupsRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/groups`, {
            headers: { Authorization: `Bearer ${token}` },
            httpsAgent: agent
        });
        
        let devGroup = groupsRes.data.find(g => g.name === 'developers');
        if (!devGroup) {
            console.log("Creating developers group...");
            await axios.post(`${KEYCLOAK_URL}/admin/realms/${REALM}/groups`, { name: 'developers' }, {
                headers: { Authorization: `Bearer ${token}` },
                httpsAgent: agent
            });
            const newGroupsRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/groups`, {
                headers: { Authorization: `Bearer ${token}` },
                httpsAgent: agent
            });
            devGroup = newGroupsRes.data.find(g => g.name === 'developers');
        }
        
        console.log("Adding user to developers group...");
        await axios.put(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${user.id}/groups/${devGroup.id}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
            httpsAgent: agent
        });
        console.log("Done!");
    } catch (e) {
        console.error("Error:", e.message);
    }
}

run();
