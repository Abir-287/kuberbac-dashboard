import express from 'express';
import { Login, LogOut, Me, changePassword } from "../controllers/Auth.js";

const router = express.Router();

router.get('/me', Me);
router.post('/login', Login);
router.post('/change-password', changePassword);
router.delete('/logout', LogOut);

export default router;