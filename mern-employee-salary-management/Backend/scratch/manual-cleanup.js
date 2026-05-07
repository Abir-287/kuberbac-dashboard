import DataPegawai from '../models/DataPegawaiModel.js';
import { syncUsers } from '../services/KeycloakSync.js';
import db from '../config/Database.js';

async function runCleanup() {
    try {
        console.log("Connecting to database...");
        await db.authenticate();
        
        console.log("Running Keycloak sync and cleanup...");
        await syncUsers();
        
        const users = await DataPegawai.findAll();
        console.log("\nCurrent Users in Database:");
        users.forEach(u => {
            console.log(`- ${u.username} (${u.hak_akses}): ${u.groups}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error("Cleanup failed:", error);
        process.exit(1);
    }
}

runCleanup();
