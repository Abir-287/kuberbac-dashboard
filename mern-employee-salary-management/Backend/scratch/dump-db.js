import DataPegawai from '../models/DataPegawaiModel.js';
import db from '../config/Database.js';

async function dump() {
    try {
        const users = await DataPegawai.findAll();
        console.log("Database Users:");
        users.forEach(u => {
            console.log(`- ${u.username}: Email="${u.email}", Groups="${u.groups}"`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

dump();
