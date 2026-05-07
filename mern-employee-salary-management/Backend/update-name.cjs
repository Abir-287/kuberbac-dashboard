const { Sequelize } = require('sequelize');

const db = new Sequelize('db_penggajian3', 'cluster_admin', 'your_strong_password', {
    host: "localhost",
    dialect: "mysql"
});

const run = async () => {
    try {
        await db.query(`UPDATE data_pegawai SET nama_pegawai = 'Abir' WHERE username = 'abir'`);
        console.log("Name updated to Abir for username abir");
        process.exit(0);
    } catch (e) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}
run();
