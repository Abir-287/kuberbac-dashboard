import { Sequelize } from 'sequelize';

const db = new Sequelize('db_penggajian3', 'cluster_admin', 'your_strong_password', {
    host: "localhost",
    dialect: "mysql"
});

export default db;