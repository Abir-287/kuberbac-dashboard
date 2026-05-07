import axios from 'axios';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false });

async function run() {
    try {
        const url = "https://192.168.122.235:8443/realms/kubernetes/protocol/openid-connect/auth?client_id=kubernetes_oidc&code_challenge=y9Hvx5B8v5lORNh8tk3EzLpOvT44ArN54QVX9RSfp9Q&code_challenge_method=S256&redirect_uri=https%3A%2F%2F192.168.122.23%3A5556%2Fcallback&response_type=code&scope=openid+openid+profile+email+groups&state=k36z7xsusuzdproxuyxthcd5w";
        const res = await axios.get(url, { httpsAgent: agent, validateStatus: () => true });
        console.log("Status:", res.status);
        console.log("HTML:", res.data);
    } catch (e) {
        console.error(e.message);
    }
}
run();
