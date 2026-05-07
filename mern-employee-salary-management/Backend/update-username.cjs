const { Sequelize } = require('sequelize');

const db = new Sequelize('db_penggajian3', 'cluster_admin', 'your_strong_password', {
    host: "localhost",
    dialect: "mysql"
});

const run = async () => {
    try {
        await db.query(`UPDATE data_pegawai SET username = 'abir' WHERE username = 'aldi'`);
        console.log("Username updated from aldi to abir");
        process.exit(0);
    } catch (e) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}
run();
