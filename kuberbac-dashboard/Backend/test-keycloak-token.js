import axios from 'axios';
import https from 'https';
import jwt from 'jsonwebtoken';

const KEYCLOAK_URL = "https://192.168.122.235:8443";
const REALM = "kubernetes";
const agent = new https.Agent({ rejectUnauthorized: false });

async function run() {
    try {
        const params = new URLSearchParams();
        params.append('client_id', 'kubernetes_oidc');
        params.append('client_secret', 'yC1ClZ4woewVKQ8aLiJJM6AI20UxnBm7'); // From user's dex config
        params.append('username', 'developer');
        params.append('password', 'Developer123!');
        params.append('grant_type', 'password');
        params.append('scope', 'openid profile email');

        const res = await axios.post(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, params, { httpsAgent: agent });
        
        console.log("Got token from Keycloak directly!");
        const claims = jwt.decode(res.data.id_token || res.data.access_token);
        console.log("CLAIMS:", JSON.stringify(claims, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) console.error(e.response.data);
    }
}
run();
