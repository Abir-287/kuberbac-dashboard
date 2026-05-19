import GitOpsHelper from '../utils/GitOpsHelper.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSync() {
    console.log("Testing forceArgoCDSync...");
    await GitOpsHelper.forceArgoCDSync();
    console.log("Done.");
}

testSync().catch(console.error);
