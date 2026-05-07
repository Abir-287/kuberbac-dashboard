import db from '../config/Database.js';
import DataPegawai from '../models/DataPegawaiModel.js';
import DataJabatan from '../models/DataJabatanModel.js';

async function update() {
    try {
        console.log("Syncing database models...");
        await db.sync({ alter: true });
        console.log("Database updated successfully.");
    } catch (e) {
        console.error("Database update failed:", e.message);
    } finally {
        process.exit();
    }
}

update();
