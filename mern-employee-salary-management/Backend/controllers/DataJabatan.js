import { k8sApi } from "../config/K8sConfig.js";

// menampilkan semua data namespace (real K8s)
export const getDataJabatan = async (req, res) => {
    try {
        const response = await k8sApi.listNamespace();
        const namespaces = response.items.map((ns) => ({
            id: ns.metadata.name, // Use name as ID
            nama_jabatan: ns.metadata.name,
            gaji_pokok: ns.status.phase, // Re-purpose for Status
            tj_transport: ns.metadata.creationTimestamp, // Re-purpose for Creation Date
            uang_makan: ns.metadata.uid.substring(0, 8), // Re-purpose for UID snippet
        }));
        console.log(`Successfully fetched ${namespaces.length} namespaces from K8s.`);
        res.status(200).json(namespaces);
    } catch (error) {
        console.error("K8s List Namespace Error:", error.message);
        res.status(500).json({ msg: "Failed to fetch namespaces from cluster" });
    }
}

// method untuk menampilkan data namespace by ID (Name)
export const getDataJabatanByID = async (req, res) => {
    try {
        const ns = await k8sApi.readNamespace({ name: req.params.id });
        res.status(200).json({
            id: ns.metadata.name,
            nama_jabatan: ns.metadata.name,
            gaji_pokok: ns.status.phase,
            tj_transport: ns.metadata.creationTimestamp,
            uang_makan: ns.metadata.uid.substring(0, 8),
        });
    } catch (error) {
        res.status(404).json({msg: 'Namespace not found'});
    }
}

// method untuk tambah namespace
export const createDataJabatan = async (req, res) => {
    const { nama_jabatan } = req.body;
    try {
        await k8sApi.createNamespace({
            body: {
                metadata: { name: nama_jabatan }
            }
        });
        res.status(201).json({ success: true, message: "Namespace successfully created in cluster" });
    } catch (error) {
        console.error("K8s Create Namespace Error:", error.message);
        res.status(500).json({ success: false, message: error.response?.body?.message || error.message });
    }
}

// method untuk update namespace
export const updateDataJabatan = async (req, res) => {
    res.status(200).json({ msg: "Update not supported for K8s Namespaces via this endpoint" });
}

// method pour supprimer un namespace
export const deleteDataJabatan = async (req, res) => {
    try {
        await k8sApi.deleteNamespace({ name: req.params.id });
        res.status(200).json({ msg: "Namespace deletion initiated in cluster" });
    } catch (error) {
        console.error("K8s Delete Namespace Error:", error.message);
        res.status(500).json({ msg: error.response?.body?.message || error.message });
    }
}

// method to list pods within a namespace
export const getPodsInNamespace = async (req, res) => {
    const { name } = req.params;
    try {
        const response = await k8sApi.listNamespacedPod({ namespace: name });
        const pods = response.items.map((pod) => {
            const containerStatuses = pod.status.containerStatuses || [];
            const totalRestarts = containerStatuses.reduce((sum, c) => sum + (c.restartCount || 0), 0);
            const readyCount = containerStatuses.filter(c => c.ready).length;
            const totalContainers = pod.spec.containers.length;

            const startTime = pod.status.startTime ? new Date(pod.status.startTime) : null;
            const ageMs = startTime ? Date.now() - startTime.getTime() : null;
            const ageStr = ageMs !== null
                ? ageMs > 86400000
                    ? `${Math.floor(ageMs / 86400000)}d`
                    : ageMs > 3600000
                        ? `${Math.floor(ageMs / 3600000)}h`
                        : `${Math.floor(ageMs / 60000)}m`
                : 'N/A';

            return {
                name: pod.metadata.name,
                namespace: pod.metadata.namespace,
                phase: pod.status.phase || 'Unknown',
                ready: `${readyCount}/${totalContainers}`,
                restarts: totalRestarts,
                node: pod.spec.nodeName || 'N/A',
                age: ageStr,
                ip: pod.status.podIP || 'N/A',
            };
        });
        res.status(200).json(pods);
    } catch (error) {
        console.error("K8s List Pods Error:", error.message);
        res.status(500).json({ msg: `Failed to fetch pods for namespace ${name}` });
    }
}