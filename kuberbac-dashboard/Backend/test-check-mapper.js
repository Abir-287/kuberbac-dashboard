import axios from 'axios';
import https from 'https';

const KEYCLOAK_URL = "https://192.168.122.235:8443";
const REALM = "kubernetes";
const ADMIN_USER = "admin";
const ADMIN_PASS = "Admin123!";
const agent = new https.Agent({ rejectUnauthorized: false });

async function run() {
    const params = new URLSearchParams();
    params.append('client_id', 'admin-cli');
    params.append('username', ADMIN_USER);
    params.append('password', ADMIN_PASS);
    params.append('grant_type', 'password');
    const tokenRes = await axios.post(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, params, { httpsAgent: agent });
    const token = tokenRes.data.access_token;
    
    const clientsRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients?clientId=kubernetes_oidc`, {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: agent
    });
    
    const mappersRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${clientsRes.data[0].id}/protocol-mappers/models`, {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: agent
    });
    
    console.log(JSON.stringify(mappersRes.data.find(m => m.name === 'groups'), null, 2));
}
run();
