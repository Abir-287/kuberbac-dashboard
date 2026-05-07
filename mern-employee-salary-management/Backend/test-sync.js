import { syncUsers } from './services/KeycloakSync.js';
import db from './config/Database.js';

async function test() {
    try {
        await db.authenticate();
        console.log("Database connected.");
        await syncUsers();
    } catch (e) {
        console.error("Test failed:", e.message);
    } finally {
        process.exit();
    }
}

test();
