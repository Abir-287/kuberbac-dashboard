import DataPegawai from "../models/DataPegawaiModel.js";
import argon2 from "argon2";
import path from "path";
import axios from "axios";

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

async function getGroupIdByName(groupName, token) {
    try {
        const res = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/groups?search=${groupName}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const group = res.data.find(g => g.name === groupName);
        return group ? group.id : null;
    } catch (e) {
        return null;
    }
}

// menampilkan semua data Pegawai
export const getDataPegawai = async (req, res) => {
    try {
        const response = await DataPegawai.findAll({
            attributes: [
                'id', 'nik', 'nama_pegawai',
                'jenis_kelamin', 'jabatan', 'tanggal_masuk',
                'status', 'photo', 'hak_akses', 'email', 'groups'
            ]
        });
        const mappedResponse = response.map(u => ({
            ...u.toJSON(),
            email: u.email || "",
            groups: u.groups || ""
        }));
        res.status(200).json(mappedResponse);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// method untuk mencari data Pegawai berdasarkan ID
export const getDataPegawaiByID = async (req, res) => {
    try {
        const response = await DataPegawai.findOne({
            attributes: [
                'id', 'nik', 'nama_pegawai',
                'jenis_kelamin', 'jabatan', 'username', 'tanggal_masuk',
                'status', 'photo', 'hak_akses', 'email', 'groups'
            ],
            where: {
                id: req.params.id
            }
        });
        if (response) {
            res.status(200).json(response);
        } else {
            res.status(404).json({ msg: 'Data pegawai dengan ID tersebut tidak ditemukan' })
        }
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// method untuk mencari data pegawai berdasarkan NIK
export const getDataPegawaiByNik = async (req, res) => {
    try {
        const response = await DataPegawai.findOne({
            attributes: [
                'id', 'nik', 'nama_pegawai',
                'jenis_kelamin', 'jabatan', 'tanggal_masuk',
                'status', 'photo', 'hak_akses', 'email', 'groups'
            ],
            where: {
                nik: req.params.nik
            }
        });
        if (response) {
            res.status(200).json(response);
        } else {
            res.status(404).json({ msg: 'Data pegawai dengan NIK tersebut tidak ditemukan' })
        }
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// method untuk mencari data pegawai berdasarkan Nama
export const getDataPegawaiByName = async (req, res) => {
    try {
        const response = await DataPegawai.findOne({
            attributes: [
                'id', 'nik', 'nama_pegawai',
                'jenis_kelamin', 'jabatan', 'tanggal_masuk',
                'status', 'photo', 'hak_akses', 'email', 'groups'
            ],
            where: {
                nama_pegawai: req.params.name
            }
        });
        if (response) {
            res.status(200).json(response);
        } else {
            res.status(404).json({ msg: 'Data pegawai dengan Nama tersebut tidak ditemukan' })
        }
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// Updated createDataPegawai to integrate with Keycloak
export const createDataPegawai = async (req, res) => {
    const {
        nama_pegawai, username, email, password, confPassword, groups, hak_akses
    } = req.body;

    if (password !== confPassword) {
        return res.status(400).json({ msg: "Passwords do not match" });
    }

    const token = await getAdminToken();
    if (!token) return res.status(500).json({ msg: "Internal Server Error: Keycloak Auth Failed" });

    try {
        // 1. Create User in Keycloak
        const kcUserRes = await axios.post(`${KEYCLOAK_URL}/admin/realms/${REALM}/users`, {
            username: username,
            email: email,
            firstName: nama_pegawai.split(' ')[0] || username,
            lastName: nama_pegawai.split(' ').slice(1).join(' ') || "",
            enabled: true,
            emailVerified: true
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Get created user ID from Location header
        const userUrl = kcUserRes.headers.location;
        const kcUserId = userUrl.split('/').pop();

        // 2. Set Password in Keycloak
        await axios.put(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${kcUserId}/reset-password`, {
            type: "password",
            value: password,
            temporary: false
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // 3. Add to Group if specified
        if (groups) {
            const groupId = await getGroupIdByName(groups, token);
            if (groupId) {
                await axios.put(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${kcUserId}/groups/${groupId}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        }

        // 4. Create in Local DB
        const hashPassword = await argon2.hash(password);
        await DataPegawai.create({
            nik: "KC-" + kcUserId.substring(0, 8),
            nama_pegawai: nama_pegawai,
            username: username,
            email: email,
            groups: groups,
            password: hashPassword,
            jenis_kelamin: "Laki-laki",
            jabatan: "Staff",
            tanggal_masuk: new Date().toISOString().split('T')[0],
            status: "Karyawan Tetap",
            photo: "default.png",
            hak_akses: hak_akses || "pegawai"
        });

        res.status(201).json({ success: true, message: "User successfully created in Keycloak and Dashboard" });
    } catch (error) {
        console.error("Keycloak Creation Error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ 
            success: false, 
            msg: error.response?.data?.errorMessage || error.message 
        });
    }
};

// method untuk update data Pegawai
export const updateDataPegawai = async (req, res) => {
    const pegawai = await DataPegawai.findOne({
        where: { id: req.params.id }
    });

    if (!pegawai) return res.status(404).json({ msg: "Data pegawai tidak ditemukan" });
    const {
        nama_pegawai,
        username,
        hak_akses,
        email,
        groups
    } = req.body;

    try {
        await DataPegawai.update({
            nama_pegawai: nama_pegawai,
            username: username,
            email: email,
            groups: groups,
            hak_akses: hak_akses
        }, {
            where: {
                id: pegawai.id
            }
        });
        res.status(200).json({ msg: "User updated successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
}

// Method untuk update password Pegawai
export const changePasswordAdmin = async (req, res) => {
    const pegawai = await DataPegawai.findOne({
        where: { id: req.params.id }
    });

    if (!pegawai) return res.status(404).json({ msg: "Data pegawai tidak ditemukan" });

    const { password, confPassword } = req.body;
    if (password !== confPassword) return res.status(400).json({ msg: "Password dan Konfirmasi Password Tidak Cocok" });

    try {
        const hashPassword = await argon2.hash(password);
        await DataPegawai.update(
            { password: hashPassword },
            { where: { id: pegawai.id } }
        );
        res.status(200).json({ msg: "Password Berhasil di Perbarui" });
    } catch (error) {
        res.status(500).json({ msg: "Internal Server Error" });
    }
};

// method untuk delete data Pegawai
export const deleteDataPegawai = async (req, res) => {
    const pegawai = await DataPegawai.findOne({
        where: { id: req.params.id }
    });
    if (!pegawai) return res.status(404).json({ msg: "Data Pegawai tidak ditemukan" });

    const token = await getAdminToken();
    
    try {
        // Try to delete from Keycloak first if we have the username
        if (token) {
            const kcUsersRes = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/users?username=${pegawai.username}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const kcUser = kcUsersRes.data.find(u => u.username === pegawai.username);
            if (kcUser) {
                await axios.delete(`${KEYCLOAK_URL}/admin/realms/${REALM}/users/${kcUser.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        }

        await DataPegawai.destroy({
            where: { id: pegawai.id }
        });
        res.status(200).json({ msg: "User successfully deleted from Keycloak and Dashboard" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
}