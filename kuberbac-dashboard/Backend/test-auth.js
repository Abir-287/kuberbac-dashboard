import https from "https";
import axios from "axios";
import jwt from "jsonwebtoken";
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const DEX_URL    = "https://192.168.122.23:5556";
const KUBE_API   = "https://192.168.122.220:6443";
const CLIENT_ID  = "kubernetes_oidc";
const CLIENT_SECRET = "kubernetes-client-secret";
const REDIRECT_URI  = "http://localhost:8000";

// ─── Helper: pretty separator ────────────────────────────────────────────────
const sep = (title) => console.log(`\n${"─".repeat(60)}\n  ${title}\n${"─".repeat(60)}`);

// ─── Step through Dex → Keycloak → token endpoint ────────────────────────────
async function getOIDCToken(username, password) {
    const jar = new CookieJar();
    const client = wrapper(axios.create({
        jar,
        maxRedirects: 0,
        validateStatus: s => s >= 200 && s < 400
    }));

    // 1. Start Dex OIDC flow
    let res = await client.get(
        `${DEX_URL}/auth?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=openid+profile+email+groups`
    );
    let keycloakRedirectUrl = new URL(res.headers.location, DEX_URL).href;

    // 2. Follow Dex → Keycloak connector redirect
    res = await client.get(keycloakRedirectUrl);
    let keycloakAuthUrl = res.headers.location;

    // 3. Fetch Keycloak login page and extract form action
    res = await client.get(keycloakAuthUrl);
    const actionMatch = res.data.match(/action="([^"]+)"/);
    if (!actionMatch) throw new Error("Could not find Keycloak form action");
    const submitUrl = actionMatch[1].replace(/&amp;/g, '&');

    // 4. POST credentials to Keycloak
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    res = await client.post(submitUrl, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const dexCallbackUrl = res.headers.location;
    if (!dexCallbackUrl || !dexCallbackUrl.includes('code=')) {
        throw new Error("Login failed at Keycloak — invalid credentials");
    }

    // 5. Dex callback → authorization code
    res = await client.get(dexCallbackUrl);
    const code = new URL(res.headers.location).searchParams.get('code');

    // 6. Exchange code for token at Dex /token
    res = await client.post(`${DEX_URL}/token`, new URLSearchParams({
        grant_type:    'authorization_code',
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri:  REDIRECT_URI,
        code
    }).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return res.data.id_token;
}

// ─── Hit the Kubernetes API with a bearer token ───────────────────────────────
async function callKubeAPI(token) {
    try {
        const res = await axios.get(`${KUBE_API}/api/v1/namespaces/default/pods`, {
            headers: { Authorization: `Bearer ${token}` },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });
        return { status: res.status, ok: true };
    } catch (err) {
        if (err.response) return { status: err.response.status, ok: false, msg: err.response.data?.message };
        throw err;
    }
}

// ─── Decode JWT (no verification — display only) ─────────────────────────────
function decodeToken(token) {
    try {
        return jwt.decode(token);
    } catch {
        return null;
    }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║       OIDC / JWT Authentication Verification Test        ║");
    console.log("╚══════════════════════════════════════════════════════════╝");

    // ══════════════════════════════════════════════════════════
    // TEST 1 — VALID credentials
    // ══════════════════════════════════════════════════════════
    sep("TEST 1 — VALID user: admin / Admin123!");
    try {
        const token = await getOIDCToken("admin", "Admin123!");

        console.log("\n📄 Raw JWT Token (id_token):");
        console.log(token);

        const claims = decodeToken(token);
        console.log("\n🔓 Decoded JWT Payload:");
        console.log(JSON.stringify(claims, null, 2));

        console.log("\n🔑 Key Claims:");
        console.log(`  sub      : ${claims.sub}`);
        console.log(`  email    : ${claims.email}`);
        console.log(`  name     : ${claims.name}`);
        console.log(`  groups   : ${JSON.stringify(claims.groups)}`);
        console.log(`  iss      : ${claims.iss}`);
        console.log(`  aud      : ${claims.aud}`);
        console.log(`  exp      : ${new Date(claims.exp * 1000).toISOString()}`);

        const kubeRes = await callKubeAPI(token);
        console.log(`\n🌐 Kubernetes API Response: HTTP ${kubeRes.status}`);
        if (kubeRes.status === 200 || kubeRes.status === 403) {
            console.log("✅ RESULT: Token ACCEPTED by Kubernetes API (user is authenticated).");
        }
    } catch (e) {
        console.error("❌ Failed:", e.message);
    }

    // ══════════════════════════════════════════════════════════
    // TEST 2 — INVALID credentials (no token obtained)
    // ══════════════════════════════════════════════════════════
    sep("TEST 2 — INVALID credentials: fakeuser / wrongpassword");
    try {
        await getOIDCToken("fakeuser", "wrongpassword");
        console.log("❌ Unexpected: token was issued for fake credentials!");
    } catch (e) {
        console.log(`\n🚫 Keycloak rejected login: ${e.message}`);
        console.log("✅ RESULT: No token issued — user is UNAUTHORIZED (as expected).");
    }

    // ══════════════════════════════════════════════════════════
    // TEST 3 — FORGED / TAMPERED token against Kube API
    // ══════════════════════════════════════════════════════════
    sep("TEST 3 — FORGED token against Kubernetes API");
    const fakeToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImZha2Uta2lkIn0.eyJzdWIiOiJmYWtldXNlciIsImVtYWlsIjoiZmFrZUBleGFtcGxlLmNvbSIsImdyb3VwcyI6WyJjbHVzdGVyLWFkbWluIl0sImlhdCI6MTYwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.INVALID_SIGNATURE";

    const fakeClaims = decodeToken(fakeToken);
    console.log("\n📄 Forged Token Payload (what attacker claims):");
    console.log(JSON.stringify(fakeClaims, null, 2));

    const kubeRes = await callKubeAPI(fakeToken);
    console.log(`\n🌐 Kubernetes API Response: HTTP ${kubeRes.status}`);
    if (kubeRes.status === 401) {
        console.log(`  Message: ${kubeRes.msg}`);
        console.log("✅ RESULT: Token REJECTED by Kubernetes API — signature is invalid (UNAUTHORIZED).");
    }

    console.log("\n");
}

main();
