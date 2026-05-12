import DataPegawai from "../models/DataPegawaiModel.js";
import argon2 from "argon2";

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
    const { name, username, email, password, role, groups } = req.body;
    try {
        const hashPassword = await argon2.hash(password);
        await DataPegawai.create({
            nama_pegawai: name,
            username: username,
            email: email,
            password: hashPassword,
            hak_akses: role,
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

    const { name, username, email, password, role, groups } = req.body;
    let hashPassword;
    if (password === "" || password === null) {
        hashPassword = user.password;
    } else {
        hashPassword = await argon2.hash(password);
    }

    try {
        await DataPegawai.update({
            nama_pegawai: name,
            username: username,
            email: email,
            password: hashPassword,
            hak_akses: role,
            groups: groups
        }, {
            where: { id: user.id }
        });
        res.status(200).json({ msg: "User updated successfully" });
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
        await DataPegawai.destroy({
            where: { id: user.id }
        });
        res.status(200).json({ msg: "User deleted successfully" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};
