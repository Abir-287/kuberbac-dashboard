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

// Helper to map Kubernetes Pod data for the frontend
const mapPodData = (pod) => {
    const startTime = new Date(pod.status.startTime || pod.metadata.creationTimestamp);
    const ageMs = new Date() - startTime;
    const days = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ageMs / (1000 * 60 * 60)) % 24);
    const age = days > 0 ? `${days}d${hours}h` : `${hours}h`;

    const containerStatuses = pod.status.containerStatuses || [];
    const readyCount = containerStatuses.filter(c => c.ready).length;
    const totalContainers = containerStatuses.length;
    const restarts = containerStatuses.reduce((acc, c) => acc + c.restartCount, 0);

    return {
        name: pod.metadata.name,
        namespace: pod.metadata.namespace,
        phase: pod.status.phase,
        ready: `${readyCount}/${totalContainers}`,
        restarts: restarts,
        node: pod.spec.nodeName || 'N/A',
        ip: pod.status.podIP || 'N/A',
        age: age
    };
};

// Get Pods in a Namespace
export const getPodsInNamespace = async (req, res) => {
    const { name } = req.params;
    try {
        const response = await k8sApi.listNamespacedPod({ namespace: name });
        const mappedPods = response.items.map(mapPodData);
        res.status(200).json(mappedPods);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Get All Pods across all namespaces
export const getAllPods = async (req, res) => {
    try {
        const response = await k8sApi.listPodForAllNamespaces();
        const mappedPods = response.items
            .filter(pod => !pod.metadata.namespace.startsWith('kube-')) // Hide system pods
            .map(mapPodData);
        res.status(200).json(mappedPods);
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
