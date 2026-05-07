import axios from 'axios';

const API_URL = "http://localhost:5000";

async function testList() {
    try {
        const agent = axios.create({ withCredentials: true });
        
        console.log("Logging in as admin...");
        await agent.post(`${API_URL}/login`, {
            username: 'admin',
            password: 'password' // I need to be sure about this password, or maybe use the session of the user
        });

        console.log("Fetching namespaces...");
        const res = await agent.get(`${API_URL}/data_jabatan`);
        console.log("Success! Found", res.data.length, "namespaces.");
        console.log(res.data.slice(0, 2));
    } catch (e) {
        console.error("Failed:", e.response?.data || e.message);
    }
}

testList();
