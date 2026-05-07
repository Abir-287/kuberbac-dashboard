import { rbacApi } from "../config/K8sConfig.js";
import DataPegawai from "../models/DataPegawaiModel.js";

// List RoleBindings in a namespace
export const getRoleBindings = async (req, res) => {
    const { namespace } = req.params;
    try {
        const response = await rbacApi.listNamespacedRoleBinding({ namespace });
        res.status(200).json(response.items);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Create a RoleBinding
export const createRoleBinding = async (req, res) => {
    const { namespace } = req.params;
    const { username, roleName, roleKind, bindingName } = req.body;
    
    try {
        // Kubernetes metadata names cannot contain '@' or '.'
        const sanitizedUser = username.replace(/[@.]/g, '-').toLowerCase();
        
        const body = {
            metadata: { name: bindingName || `${sanitizedUser}-${roleName}-binding` },
            subjects: [{
                kind: 'User',
                name: username,
                apiGroup: 'rbac.authorization.k8s.io'
            }],
            roleRef: {
                kind: roleKind || 'ClusterRole',
                name: roleName,
                apiGroup: 'rbac.authorization.k8s.io'
            }
        };
        await rbacApi.createNamespacedRoleBinding({ namespace, body });
        res.status(201).json({ msg: "RoleBinding created successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.response?.body?.message || error.message });
    }
};

// Delete a RoleBinding
export const deleteRoleBinding = async (req, res) => {
    const { namespace, name } = req.params;
    try {
        await rbacApi.deleteNamespacedRoleBinding({ name, namespace });
        res.status(200).json({ msg: "RoleBinding deleted successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.response?.body?.message || error.message });
    }
};

// List available Roles (both ClusterRoles and namespace Roles) for selection in UI
export const getAvailableRoles = async (req, res) => {
    const { namespace } = req.params;
    try {
        // Fetch ClusterRoles
        const clusterRoleResponse = await rbacApi.listClusterRole();
        const commonRoles = ["admin", "edit", "view", "cluster-admin"];
        const clusterRoles = clusterRoleResponse.items
            .filter(role => commonRoles.includes(role.metadata.name) || !role.metadata.name.startsWith("system:"))
            .map(role => ({ name: role.metadata.name, kind: 'ClusterRole' }));

        // Fetch namespace Roles
        let namespacedRoles = [];
        try {
            const roleResponse = await rbacApi.listNamespacedRole({ namespace });
            namespacedRoles = roleResponse.items.map(role => ({ name: role.metadata.name, kind: 'Role' }));
        } catch (e) {
            console.log(`Could not fetch namespaced roles for ${namespace}: ${e.message}`);
        }

        res.status(200).json([...namespacedRoles, ...clusterRoles]);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Create a custom Role in the namespace
export const createRole = async (req, res) => {
    const { namespace } = req.params;
    const { roleName, resources, verbs } = req.body;
    
    // Convert comma-separated strings to arrays, trimming whitespace
    const resourcesArray = resources ? resources.split(',').map(s => s.trim()) : [];
    const verbsArray = verbs ? verbs.split(',').map(s => s.trim()) : [];

    try {
        const body = {
            metadata: { name: roleName, namespace },
            rules: [{
                apiGroups: ["", "apps", "batch", "extensions"], // Common API groups
                resources: resourcesArray,
                verbs: verbsArray
            }]
        };
        await rbacApi.createNamespacedRole({ namespace, body });
        res.status(201).json({ msg: "Role created successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.response?.body?.message || error.message });
    }
};

// Get all permissions for a specific user across all namespaces
export const getUserPermissions = async (req, res) => {
    const { username } = req.params;
    try {
        // Fetch user from DB to get their email
        const user = await DataPegawai.findOne({
            where: { username: username }
        });

        const userEmail = user?.email || "";
        const searchTerms = [username, userEmail].filter(t => t !== "");

        const response = await rbacApi.listRoleBindingForAllNamespaces();
        const userPermissions = response.items.filter(rb => 
            rb.subjects && rb.subjects.some(s => searchTerms.includes(s.name))
        ).map(rb => ({
            namespace: rb.metadata.namespace,
            roleName: rb.roleRef.name,
            bindingName: rb.metadata.name,
            kind: rb.roleRef.kind
        }));
        res.status(200).json(userPermissions);
    } catch (error) {
        res.status(500).json({ msg: error.response?.body?.message || error.message });
    }
};
