import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import db from './config/Database.js';

import SequelizeStore from 'connect-session-sequelize';
import FileUpload from 'express-fileupload';

import UserRoute from './routes/UserRoute.js';
import AuthRoute from './routes/AuthRoute.js';
import { syncUsers } from './services/KeycloakSync.js';

const app = express();

// Start Keycloak Sync
syncUsers();
setInterval(syncUsers, 5 * 60 * 1000); // Every 5 minutes

const sessionStore = SequelizeStore(session.Store);
const store = new sessionStore({
    db: db,
    tableName: 'sessions'
});

/* (async() => {
    await db.sync();
})(); */

dotenv.config();

// Middleware
app.use(session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
        secure: 'auto'
    }
}));

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://localhost:3000',
    'https://app.abir.local',      // cluster Ingress domain
];

app.use(cors({
    credentials: true,
    origin: (origin, callback) => {
        // allow curl/Postman (no origin) and any listed origin
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
}));


app.use(express.json());

app.use(FileUpload());
app.use(express.static("public"));

app.use('/api', UserRoute);
app.use('/api', AuthRoute);

// Kubernetes health check endpoint
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// store.sync();

app.listen(process.env.APP_PORT, () => {
    console.log('Server up and running...');
});