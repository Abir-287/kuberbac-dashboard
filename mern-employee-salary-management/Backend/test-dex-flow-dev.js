import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import jwt from 'jsonwebtoken';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const jar = new CookieJar();
const client = wrapper(axios.create({ 
    jar,
    maxRedirects: 0,
    validateStatus: status => status >= 200 && status < 400 
}));

async function testFlow() {
    try {
        console.log("1. Initiating Dex auth...");
        let res = await client.get("https://192.168.122.23:5556/auth?client_id=kubernetes_oidc&response_type=code&redirect_uri=http://localhost:8000/callback&scope=openid+profile+email+groups");
        
        console.log("Dex redirected to:", res.headers.location);
        let keycloakRedirectUrl = new URL(res.headers.location, "https://192.168.122.23:5556").href;

        console.log("2. Hitting Dex Keycloak Connector URL...");
        res = await client.get(keycloakRedirectUrl);
        
        console.log("Dex Connector redirected to:", res.headers.location);
        let keycloakAuthUrl = res.headers.location;

        console.log("3. Fetching Keycloak Login Page...");
        res = await client.get(keycloakAuthUrl);
        
        const html = res.data;
        const actionMatch = html.match(/action="([^"]+)"/);
        if (!actionMatch) throw new Error("Could not find form action in Keycloak HTML");
        
        let submitUrl = actionMatch[1].replace(/&amp;/g, '&');
        console.log("Extracted Keycloak Submit URL:", submitUrl);

        console.log("4. Submitting Credentials to Keycloak...");
        const params = new URLSearchParams();
        params.append('username', 'developer');
        params.append('password', 'Developer123!'); 
        
        res = await client.post(submitUrl, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log("Keycloak redirected to:", res.headers.location);
        let dexCallbackUrl = res.headers.location;

        if (dexCallbackUrl.includes("login-actions")) {
            console.log("Failed to login! Incorrect password.");
            return;
        }

        console.log("5. Hitting Dex Callback URL...");
        res = await client.get(dexCallbackUrl);

        console.log("Dex Callback redirected to:", res.headers.location);
        let appCallbackUrl = res.headers.location;

        const urlObj = new URL(appCallbackUrl);
        const code = urlObj.searchParams.get('code');
        console.log("SUCCESS! Got Auth Code:", code);

        console.log("6. Exchanging Code for Token...");
        res = await client.post("https://192.168.122.23:5556/token", new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: 'kubernetes_oidc',
            client_secret: 'kubernetes-client-secret',
            redirect_uri: 'http://localhost:8000/callback',
            code: code
        }).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log("\n=================== FINAL TOKEN CLAIMS ===================");
        const claims = jwt.decode(res.data.id_token);
        console.log(JSON.stringify(claims, null, 2));
        console.log("==========================================================\n");

    } catch (e) {
        console.error("Error in flow:", e.message);
        if (e.response) {
            console.error(e.response.status, e.response.headers.location);
        }
    }
}

testFlow();
