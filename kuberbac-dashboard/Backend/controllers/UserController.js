import DataPegawai from "../models/DataPegawaiModel.js";
import argon2 from "argon2";
import { createKeycloakUser, updateKeycloakUser, deleteKeycloakUser } from "../services/KeycloakSync.js";

// List Users
export const getUsers = async (req, res) => {
    try {
        const response = await DataPegawai.findAll({
            attributes: ['id', 'id_pegawai', 'nama_pegawai', 'username', 'email', 'hak_akses', 'groups']
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Get User By ID
export const getUserById = async (req, res) => {
    try {
        const response = await DataPegawai.findOne({
            where: { id: req.params.id }
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Get User By Name
export const getUserByName = async (req, res) => {
    try {
        const response = await DataPegawai.findOne({
            where: { nama_pegawai: req.params.name }
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Create User
export const createUser = async (req, res) => {
    const { nama_pegawai, username, email, password, hak_akses, groups } = req.body;
    try {
        // 1. Create in Keycloak first
        await createKeycloakUser({ nama_pegawai, username, email, password, groups });

        // 2. Then create in local DB
        const hashPassword = await argon2.hash(password);
        await DataPegawai.create({
            nama_pegawai: nama_pegawai,
            username: username,
            email: email,
            password: hashPassword,
            hak_akses: hak_akses,
            groups: groups,
            // Legacy defaults
            nik: "MANUAL-" + Math.floor(Math.random() * 1000000),
            jenis_kelamin: "Other",
            jabatan: "Dashboard User",
            tanggal_masuk: new Date().toISOString().split('T')[0],
            status: "Active",
            photo: "default.png"
        });
        res.status(201).json({ msg: "User created successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// Update User
export const updateUser = async (req, res) => {
    const user = await DataPegawai.findOne({
        where: { id: req.params.id }
    });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const { nama_pegawai, username, email, password, hak_akses, groups } = req.body;
    let hashPassword;
    if (!password || password.trim() === "") {
        hashPassword = user.password;
    } else {
        hashPassword = await argon2.hash(password);
    }

    try {
        // 1. Update in Keycloak
        await updateKeycloakUser({ 
            nama_pegawai, 
            username: user.username, // keep old username for lookup if changed in body? (usually not allowed)
            email, 
            password: password || null, 
            groups 
        });

        // 2. Update in Local DB
        await DataPegawai.update({
            nama_pegawai: nama_pegawai,
            username: username,
            email: email,
            password: hashPassword,
            hak_akses: hak_akses,
            groups: groups
        }, {
            where: { id: user.id }
        });
        res.status(200).json({ msg: "User updated successfully in Dashboard and Keycloak" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// Delete User
export const deleteUser = async (req, res) => {
    const user = await DataPegawai.findOne({
        where: { id: req.params.id }
    });
    if (!user) return res.status(404).json({ msg: "User not found" });
    try {
        // 1. Delete in Keycloak
        await deleteKeycloakUser(user.username);

        // 2. Delete in Local DB
        await DataPegawai.destroy({
            where: { id: user.id }
        });
        res.status(200).json({ msg: "User deleted successfully from Dashboard and Keycloak" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};
