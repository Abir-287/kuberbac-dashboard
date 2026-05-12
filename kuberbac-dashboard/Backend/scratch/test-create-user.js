import axios from 'axios';

const API_URL = "http://localhost:5000";

async function testCreate() {
    try {
        const agent = axios.create({ withCredentials: true });
        
        console.log("Logging in as admin...");
        await agent.post(`${API_URL}/login`, {
            username: 'admin',
            password: 'password' // Assuming this works or I need to check the DB
        });

        console.log("Creating user via API...");
        const res = await agent.post(`${API_URL}/data_pegawai`, {
            nama_pegawai: "Test User API",
            username: "testuserapi",
            email: "testapi@example.com",
            password: "Password123!",
            confPassword: "Password123!",
            groups: "devs",
            hak_akses: "pegawai"
        });
        console.log("Success:", res.data);
    } catch (e) {
        console.error("Failed:", e.response?.data || e.message);
    }
}

testCreate();
