import axios from 'axios';

const API_URL = "http://localhost:5000";

async function test() {
    try {
        const agent = axios.create({ withCredentials: true });
        
        console.log("Logging in...");
        const loginRes = await agent.post(`${API_URL}/login`, {
            username: 'admin',
            password: 'password' // This is the default or redirected password
        });
        
        console.log("Login successful. Fetching users...");
        const res = await agent.get(`${API_URL}/data_pegawai`);
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error("Test failed:", e.response?.data || e.message);
    }
}

test();
