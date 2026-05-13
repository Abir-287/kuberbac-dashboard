import express from 'express';
import { adminOnly, verifyUser } from '../middleware/AuthUser.js';
import { Login, Me, LogOut, changePassword } from '../controllers/Auth.js';
import { getUsers, getUserById, getUserByName, createUser, updateUser, deleteUser } from '../controllers/UserController.js';
import { getNamespaces, getPodsInNamespace, getAllPods, createNamespace, deleteNamespace } from '../controllers/NamespaceController.js';
import {
    getRoleBindings,
    createRoleBinding,
    deleteRoleBinding,
    getAvailableRoles,
    createRole,
    getUserPermissions,
    getNamespaces as getK8sNamespaces
} from '../controllers/RbacController.js';

const router = express.Router();

/* ==== Auth ==== */
router.post('/login', Login);
router.get('/me', Me);
router.delete('/logout', LogOut);
router.patch('/change_password', verifyUser, changePassword);

/* ==== Users (Dashboard) ==== */
router.get('/data_pegawai', verifyUser, adminOnly, getUsers);
router.get('/data_pegawai/id/:id', verifyUser, adminOnly, getUserById);
router.get('/data_pegawai/name/:name', verifyUser, getUserByName);
router.post('/data_pegawai', verifyUser, adminOnly, createUser);
router.patch('/data_pegawai/:id', verifyUser, adminOnly, updateUser);
router.delete('/data_pegawai/:id', verifyUser, adminOnly, deleteUser);

/* ==== Namespaces (Kubernetes) ==== */
router.get('/data_jabatan', verifyUser, adminOnly, getNamespaces);
router.post('/data_jabatan', verifyUser, adminOnly, createNamespace);
router.delete('/data_jabatan/:id', verifyUser, adminOnly, deleteNamespace);
router.get('/namespaces/:name/pods', verifyUser, adminOnly, getPodsInNamespace);
router.get('/pods/all', verifyUser, adminOnly, getAllPods);

/* ==== RBAC Management ==== */
router.get('/rbac/roles/:namespace', verifyUser, adminOnly, getAvailableRoles);
router.get('/rbac/bindings/:namespace', verifyUser, adminOnly, getRoleBindings);
router.post('/rbac/bindings/:namespace', verifyUser, adminOnly, createRoleBinding);
router.delete('/rbac/bindings/:namespace/:name', verifyUser, adminOnly, deleteRoleBinding);
router.post('/rbac/custom-roles/:namespace', verifyUser, adminOnly, createRole);
router.get('/rbac/user-permissions/:username', verifyUser, getUserPermissions);
router.get('/rbac/namespaces', verifyUser, adminOnly, getK8sNamespaces);

export default router;