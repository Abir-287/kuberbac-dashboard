import { Sequelize } from 'sequelize';
import argon2 from 'argon2';

const db = new Sequelize('db_penggajian3', 'root', '', {
    host: "localhost",
    dialect: "mysql"
});

const run = async () => {
    try {
        const hashPassword = await argon2.hash("123456");
        await db.query(`UPDATE data_pegawai SET password = '${hashPassword}' WHERE username = 'aldi'`);
        console.log("Password reset successfully to 123456");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
