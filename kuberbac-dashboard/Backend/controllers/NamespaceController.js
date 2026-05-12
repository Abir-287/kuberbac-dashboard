import { k8sApi } from "../config/K8sConfig.js";

// List Namespaces from Kubernetes
export const getNamespaces = async (req, res) => {
    try {
        const response = await k8sApi.listNamespace();
        const namespaces = response.items.map(ns => ({
            id: ns.metadata.name,
            nama_jabatan: ns.metadata.name, // Mapping for frontend compatibility
            gaji_pokok: ns.status.phase === 'Active' ? 'Active' : 'Inactive',
            tj_transport: ns.metadata.creationTimestamp,
            uang_makan: ns.metadata.uid.substring(0, 8)
        }));
        res.status(200).json(namespaces);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Get Pods in a Namespace
export const getPodsInNamespace = async (req, res) => {
    const { name } = req.params;
    try {
        const response = await k8sApi.listNamespacedPod({ namespace: name });
        res.status(200).json(response.items);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Create Namespace
export const createNamespace = async (req, res) => {
    const { nama_jabatan } = req.body;
    try {
        const body = {
            metadata: { name: nama_jabatan }
        };
        await k8sApi.createNamespace({ body });
        res.status(201).json({ msg: "Namespace created successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.response?.body?.message || error.message });
    }
};

// Delete Namespace
export const deleteNamespace = async (req, res) => {
    const { id } = req.params;
    try {
        await k8sApi.deleteNamespace({ name: id });
        res.status(200).json({ msg: "Namespace deleted successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.response?.body?.message || error.message });
    }
};
