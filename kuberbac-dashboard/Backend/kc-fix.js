import axios from 'axios';

const KEYCLOAK_URL = "https://192.168.122.235:8443";
const REALM = "kubernetes";
const ADMIN_USER = "admin";
const ADMIN_PASS = "Admin123!";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function fix() {
    try {
        const params = new URLSearchParams();
        params.append('client_id', 'admin-cli');
        params.append('username', ADMIN_USER);
        params.append('password', ADMIN_PASS);
        params.append('grant_type', 'password');

        const tokenRes = await axios.post(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, params);
        const token = tokenRes.data.access_token;
        console.log("Got master token.");

        // Find admin user in kubernetes realm
        const usersRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=admin`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (usersRes.data.length === 0) {
            console.log("No admin user found in kubernetes realm.");
            return;
        }
        
        const userId = usersRes.data[0].id;
        console.log("Found kubernetes admin user ID:", userId);

        // Get realm-management client
        const clientsRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients?clientId=realm-management`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const clientId = clientsRes.data[0].id;

        // Get realm-admin role
        const rolesRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${clientId}/roles`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const realmAdminRole = rolesRes.data.find(r => r.name === 'realm-admin');

        // Assign role to user
        await axios.post(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}/role-mappings/clients/${clientId}`, 
            [realmAdminRole], {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Successfully assigned realm-admin role to kubernetes admin user.");
        
        // Also ensure they are in cluster-admins group just in case
        const groupsRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/groups`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const clusterAdminGroup = groupsRes.data.find(g => g.name === 'cluster-admins');
        if (clusterAdminGroup) {
            await axios.put(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}/groups/${clusterAdminGroup.id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Assigned to cluster-admins group.");
        }

    } catch(e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}
fix();
