const { Sequelize } = require('sequelize');
const argon2 = require('argon2');

const db = new Sequelize('db_penggajian3', 'cluster_admin', 'your_strong_password', {
    host: "localhost",
    dialect: "mysql"
});

const run = async () => {
    try {
        const hashPassword = await argon2.hash("123456");
        await db.query(`UPDATE data_pegawai SET password = '${hashPassword}' WHERE username = 'aldi'`);
        await db.query(`UPDATE data_pegawai SET password = '${hashPassword}' WHERE username = 'budi'`);
        console.log("Password reset successfully to 123456 for both aldi and budi");
        process.exit(0);
    } catch (e) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}
run();
