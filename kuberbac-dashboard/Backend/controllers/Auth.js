import DataPegawai from "../models/DataPegawaiModel.js";
import argon2 from "argon2";
import { verifyUser } from "../middleware/AuthUser.js";
import { updateKeycloakUser } from "../services/KeycloakSync.js";
import fs from "fs";
import https from "https";
import axios from "axios";
import jwt from "jsonwebtoken";
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export const Login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ msg: "Username and password required" });
  }

  try {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ 
        jar,
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status < 400 
    }));

    // 1. Initiating Dex auth
    let response = await client.get("https://192.168.122.23:5556/auth?client_id=kubernetes_oidc&response_type=code&redirect_uri=http://localhost:8000&scope=openid+profile+email+groups");
    
    let keycloakRedirectUrl = new URL(response.headers.location, "https://192.168.122.23:5556").href;

    // 2. Hitting Dex Keycloak Connector URL
    response = await client.get(keycloakRedirectUrl);
    let keycloakAuthUrl = response.headers.location;

    // 3. Fetching Keycloak Login Page
    response = await client.get(keycloakAuthUrl);
    
    const html = response.data;
    const actionMatch = html.match(/action="([^"]+)"/);
    if (!actionMatch) throw new Error("Could not find form action in Keycloak HTML");
    
    let submitUrl = actionMatch[1].replace(/&amp;/g, '&');

    // 4. Submitting Credentials to Keycloak
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    
    response = await client.post(submitUrl, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    let dexCallbackUrl = response.headers.location;
    if (!dexCallbackUrl || !dexCallbackUrl.includes('code=')) {
        throw new Error("Invalid credentials or login failed at Keycloak");
    }

    // 5. Hitting Dex Callback URL
    response = await client.get(dexCallbackUrl);
    let appCallbackUrl = response.headers.location;

    const urlObj = new URL(appCallbackUrl);
    const code = urlObj.searchParams.get('code');

    // 6. Exchanging Code for Token
    response = await client.post("https://192.168.122.23:5556/token", new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: 'kubernetes_oidc',
        client_secret: 'kubernetes-client-secret',
        redirect_uri: 'http://localhost:8000',
        code: code
    }).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { id_token } = response.data;
    const claims = jwt.decode(id_token);

    if (!claims) {
      return res.status(401).json({ msg: "Invalid token from OIDC provider" });
    }

    const email = claims.email || `${username}@example.com`;
    const name = claims.name || username;
    const groups = claims.groups || [];

    // Fallback: if username is explicitly 'admin', grant admin access even if OIDC groups claim is missing
    const isAdmin = groups.includes("cluster-admin") || groups.includes("cluster-admins") || username === "admin";
    const assignedRole = isAdmin ? "admin" : "pegawai";

    const [pegawai, created] = await DataPegawai.findOrCreate({
      where: { username: username },
      defaults: {
        username: username,
        nama_pegawai: name,
        hak_akses: assignedRole,
        nik: "OIDC-" + Math.floor(Math.random() * 1000000),
        jenis_kelamin: "Laki-laki",
        jabatan: "Staff",
        tanggal_masuk: new Date().toISOString().split('T')[0],
        status: "Karyawan Tetap",
        photo: "default.png"
      }
    });

    if (!created) {
      await pegawai.update({
        hak_akses: assignedRole,
        nama_pegawai: name
      });
    }

    req.session.userId = pegawai.id_pegawai;

    res.status(200).json({
      id_pegawai: pegawai.id_pegawai,
      nama_pegawai: pegawai.nama_pegawai,
      username: pegawai.username,
      hak_akses: pegawai.hak_akses,
      msg: "Login Berhasil"
    });

  } catch (err) {
    console.error("OIDC Headless Login error:", err?.response?.data || err.message);
    return res.status(401).json({ msg: "Invalid credentials or OIDC connection failed" });
  }
};

export const Me = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Mohon Login ke Akun Anda!" });
  }
  const pegawai = await DataPegawai.findOne({
    attributes: ['id', 'nik', 'nama_pegawai', 'username', 'hak_akses'],
    where: {
      id_pegawai: req.session.userId
    }
  });
  if (!pegawai) return res.status(404).json({ msg: "User Tidak di Temukan" });
  res.status(200).json(pegawai);
}

export const LogOut = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(400).json({ msg: "Tidak dapat logout" });
    res.status(200).json({ msg: "Anda Telah Logout" });
  });
}

export const changePassword = async (req, res) => {
  await verifyUser(req, res, () => { });

  const userId = req.userId;

  const user = await DataPegawai.findOne({
    where: {
      id: userId
    }
  });

  if (!user) return res.status(404).json({ msg: "User not found" });

  const { password, confPassword } = req.body;

  if (password !== confPassword) return res.status(400).json({ msg: "Password and Confirm Password do not match" });

  try {
    // 1. Update in Keycloak using centralized service
    await updateKeycloakUser({
        username: user.username,
        password: password
    });

    // 2. Update in Local DB
    const hashPassword = await argon2.hash(password);
    await DataPegawai.update(
      {
        password: hashPassword
      },
      {
        where: {
          id: user.id
        }
      }
    )
    res.status(200).json({ msg: "Password successfully updated in Dashboard and Keycloak" });
  } catch (error) {
    console.error("Change Password Sync Error:", error.response?.data || error.message);
    res.status(400).json({ msg: "Failed to update password in Keycloak" });
  }
};