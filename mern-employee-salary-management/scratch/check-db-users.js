import DataPegawai from "../Backend/models/DataPegawaiModel.js";

async function test() {
    try {
        const users = await DataPegawai.findAll();
        console.log(`Found ${users.length} users in DB`);
        users.forEach(u => {
            console.log(`- ${u.username} | ${u.email} | ${u.nama_pegawai}`);
        });
    } catch (error) {
        console.error("Error:", error.message);
    }
}

test();
