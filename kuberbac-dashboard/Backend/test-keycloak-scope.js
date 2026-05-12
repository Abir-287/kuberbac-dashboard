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
        
        // 1. Get client ID
        const clientsRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients?clientId=kubernetes_oidc`, {
            headers: { Authorization: `Bearer ${token}` },
            httpsAgent: agent
        });
        const client = clientsRes.data[0];

        // 2. Check if 'groups' client scope exists
        const scopesRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/client-scopes`, {
            headers: { Authorization: `Bearer ${token}` },
            httpsAgent: agent
        });
        let groupsScope = scopesRes.data.find(s => s.name === 'groups');
        
        if (!groupsScope) {
            console.log("Creating 'groups' client scope...");
            await axios.post(`${KEYCLOAK_URL}/admin/realms/${REALM}/client-scopes`, {
                name: 'groups',
                protocol: 'openid-connect',
                attributes: {
                    "include.in.token.scope": "true",
                    "display.on.consent.screen": "true"
                }
            }, {
                headers: { Authorization: `Bearer ${token}` },
                httpsAgent: agent
            });
            const newScopesRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/client-scopes`, {
                headers: { Authorization: `Bearer ${token}` },
                httpsAgent: agent
            });
            groupsScope = newScopesRes.data.find(s => s.name === 'groups');
        } else {
            console.log("'groups' client scope already exists.");
        }

        // 3. Add mapper to the 'groups' scope
        const scopeMappersRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/client-scopes/${groupsScope.id}/protocol-mappers/models`, {
            headers: { Authorization: `Bearer ${token}` },
            httpsAgent: agent
        });
        const hasMapper = scopeMappersRes.data.find(m => m.name === 'groups');
        
        if (!hasMapper) {
            console.log("Adding mapper to 'groups' scope...");
            await axios.post(`${KEYCLOAK_URL}/admin/realms/${REALM}/client-scopes/${groupsScope.id}/protocol-mappers/models`, {
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
        }

        // 4. Assign 'groups' scope to the client as optional or default
        console.log("Assigning 'groups' scope to client...");
        await axios.put(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${client.id}/default-client-scopes/${groupsScope.id}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
            httpsAgent: agent
        }).catch(e => {
            // Might fail if already added
        });
        
        console.log("Keycloak successfully configured with 'groups' scope!");
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) console.error(e.response.data);
    }
}
run();
