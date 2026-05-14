import axios from 'axios';
import DataPegawai from '../models/DataPegawaiModel.js';
import { Op } from 'sequelize';

const KEYCLOAK_URL = "https://192.168.122.235:8443";
const REALM = "kubernetes";
const ADMIN_USER = "admin";
const ADMIN_PASS = "Admin123!";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function getAdminToken() {
    try {
        const params = new URLSearchParams();
        params.append('client_id', 'admin-cli');
        params.append('username', ADMIN_USER);
        params.append('password', ADMIN_PASS);
        params.append('grant_type', 'password');

        const res = await axios.post(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, params);
        return res.data.access_token;
    } catch (e) {
        console.error("Failed to get Keycloak Admin Token:", e.message);
        return null;
    }
}

async function getUserGroups(userId, token) {
    try {
        const res = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}/groups`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data.map(g => g.name).join(', ');
    } catch (e) {
        return "";
    }
}

export const createKeycloakUser = async (userData) => {
    const token = await getAdminToken();
    if (!token) throw new Error("Could not connect to Keycloak Admin API");

    try {
        // 1. Create the user
        await axios.post(`${KEYCLOAK_URL}/admin/realms/${REALM}/users`, {
            username: userData.username,
            email: userData.email,
            emailVerified: true,
            enabled: true,
            firstName: userData.nama_pegawai.split(' ')[0],
            lastName: userData.nama_pegawai.split(' ').slice(1).join(' ') || '',
            credentials: [{
                type: "password",
                value: userData.password,
                temporary: false
            }]
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // 2. Get the new user's ID to assign groups
        const usersRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=${userData.username}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const userId = usersRes.data[0].id;

        // 3. Assign to group if specified
        if (userData.groups) {
            // Find group ID
            const groupsRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/groups`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const group = groupsRes.data.find(g => g.name === userData.groups);
            if (group) {
                await axios.put(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}/groups/${group.id}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        }
        return userId;
    } catch (e) {
        console.error("Keycloak Creation Error:", e.response?.data || e.message);
        throw new Error(e.response?.data?.errorMessage || "Failed to create user in Keycloak");
    }
};

export const syncUsers = async () => {
    console.log("Starting Keycloak User Sync...");
    const token = await getAdminToken();
    if (!token) return;

    try {
        const res = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const keycloakUsers = res.data;
        const keycloakUsernames = keycloakUsers.map(u => u.username);

        // Find Admin user ID to use as fallback for foreign keys
        const adminUser = await DataPegawai.findOne({ where: { username: 'admin' } });
        if (adminUser) {
            // Re-assign any legacy records if needed (removed DataJabatan)
            const usersToDelete = await DataPegawai.findAll({
                where: { username: { [Op.notIn]: keycloakUsernames } }
            });
        }

        // 1. Delete users not in Keycloak
        await DataPegawai.destroy({
            where: {
                username: { [Op.notIn]: keycloakUsernames }
            }
        });

        // 2. Upsert users from Keycloak
        for (const user of keycloakUsers) {
            const groups = await getUserGroups(user.id, token);
            
            const [pegawai, created] = await DataPegawai.findOrCreate({
                where: { username: user.username },
                defaults: {
                    username: user.username,
                    nama_pegawai: user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.username,
                    email: user.email || "",
                    groups: groups,
                    hak_akses: (groups.includes("cluster-admins") || groups.includes("cluster-admin") || user.username === "admin") ? "admin" : "pegawai",
                    nik: "KC-" + user.id.substring(0, 8),
                    jenis_kelamin: "Laki-laki",
                    jabatan: "Staff",
                    status: "Karyawan Tetap",
                    photo: "default.png",
                    tanggal_masuk: new Date().toISOString().split('T')[0]
                }
            });

            if (!created) {
                await pegawai.update({
                    nama_pegawai: user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.username,
                    email: user.email || "",
                    groups: groups,
                    hak_akses: (groups.includes("cluster-admins") || groups.includes("cluster-admin") || user.username === "admin") ? "admin" : "pegawai"
                });
            }
        }
        console.log(`Successfully synced and cleaned up users. Total Keycloak users: ${keycloakUsers.length}`);
    } catch (e) {
        console.error("Keycloak Sync Error:", e.message);
    }
};
