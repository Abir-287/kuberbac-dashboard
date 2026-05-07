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
        console.log("Got token:", !!token);
        
        // Find user developer
        const usersRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=developer`, {
            headers: { Authorization: `Bearer ${token}` },
            httpsAgent: agent
        });
        
        const user = usersRes.data.find(u => u.username === 'developer');
        if (user) {
            console.log("Developer User:", user.id, user.email, "Verified:", user.emailVerified);
            
            // Set verified
            if (!user.emailVerified) {
                user.emailVerified = true;
                await axios.put(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${user.id}`, user, {
                    headers: { Authorization: `Bearer ${token}` },
                    httpsAgent: agent
                });
                console.log("Successfully set emailVerified to true!");
            }
        }
        
        // Find client kubernetes_oidc
        const clientsRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients?clientId=kubernetes_oidc`, {
            headers: { Authorization: `Bearer ${token}` },
            httpsAgent: agent
        });
        
        if (clientsRes.data.length > 0) {
            const client = clientsRes.data[0];
            console.log("Found client:", client.id);
            
            // Get protocol mappers
            const mappersRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${client.id}/protocol-mappers/models`, {
                headers: { Authorization: `Bearer ${token}` },
                httpsAgent: agent
            });
            
            const groupMapper = mappersRes.data.find(m => m.name === 'groups');
            if (groupMapper) {
                console.log("Groups mapper already exists!");
            } else {
                console.log("Creating groups mapper...");
                await axios.post(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${client.id}/protocol-mappers/models`, {
                    protocol: "openid-connect",
                    protocolMapper: "oidc-group-membership-mapper",
                    name: "groups",
                    config: {
                        "claim.name": "groups",
                        "full.path": "false",
                        "id.token.claim": "true",
                        "access.token.claim": "true",
                        "userinfo.token.claim": "true"
                    }
                }, {
                    headers: { Authorization: `Bearer ${token}` },
                    httpsAgent: agent
                });
                console.log("Groups mapper created successfully!");
            }
        }
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) console.error(e.response.data);
    }
}

run();
