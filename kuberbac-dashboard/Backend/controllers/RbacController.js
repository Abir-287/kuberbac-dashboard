import { rbacApi, k8sApi } from "../config/K8sConfig.js";
import DataPegawai from "../models/DataPegawaiModel.js";
import GitOpsHelper from "../utils/GitOpsHelper.js";

// List RoleBindings in a namespace (Live from cluster for UI visibility)
export const getRoleBindings = async (req, res) => {
    const { namespace } = req.params;
    try {
        const response = await rbacApi.listNamespacedRoleBinding({ namespace });
        const items = response.items || [];
        res.status(200).json(items);
    } catch (error) {
        console.error(`Error fetching bindings for ${namespace}:`, error.message);
        res.status(500).json({ msg: "Kubernetes API Error: " + error.message });
    }
};

// Create a RoleBinding via GitOps
export const createRoleBinding = async (req, res) => {
    const { namespace } = req.params;
    const { username, roleName, roleKind, bindingName, subjectKind } = req.body;
    
    try {
        const finalKind = subjectKind || 'User';
        
        let subjectName = username;
        if (finalKind === 'User') {
            const user = await DataPegawai.findOne({
                where: { username: username }
            });
            if (user && user.email) {
                subjectName = user.email;
            }
        }
        
        const sanitizedSubject = subjectName.replace(/[@.]/g, '-').toLowerCase();
        
        const resource = {
            apiVersion: 'rbac.authorization.k8s.io/v1',
            kind: 'RoleBinding',
            metadata: { 
                name: bindingName || `${sanitizedSubject}-${roleName}-binding`,
                namespace: namespace 
            },
            subjects: [{
                kind: finalKind,
                name: subjectName, // The name is the group name or user email
                apiGroup: 'rbac.authorization.k8s.io'
            }],
            roleRef: {
                kind: roleKind || 'ClusterRole',
                name: roleName,
                apiGroup: 'rbac.authorization.k8s.io'
            }
        };

        // Push to Git instead of direct apply
        await GitOpsHelper.updateRbacFile(resource);
        
        res.status(201).json({ msg: "RoleBinding submitted to GitOps. ArgoCD will sync it shortly." });
    } catch (error) {
        res.status(500).json({ msg: "GitOps Error: " + error.message });
    }
};

// Delete a RoleBinding via GitOps
export const deleteRoleBinding = async (req, res) => {
    const { namespace, name } = req.params;
    try {
        // Pure GitOps: Only update GitHub, let ArgoCD handle cluster deletion
        await GitOpsHelper.deleteRbacResource('RoleBinding', name, namespace);
        res.status(200).json({ msg: "RoleBinding deletion submitted to GitOps. ArgoCD will sync it shortly." });
    } catch (error) {
        res.status(500).json({ msg: "GitOps Delete Error: " + error.message });
    }
};

// List available Roles (both ClusterRoles and namespace Roles) for selection in UI
export const getAvailableRoles = async (req, res) => {
    const { namespace } = req.params;
    try {
        const clusterRoleResponse = await rbacApi.listClusterRole();
        const commonRoles = ["admin", "edit", "view", "cluster-admin"];
        const clusterRoles = clusterRoleResponse.items
            .filter(role => commonRoles.includes(role.metadata.name) || !role.metadata.name.startsWith("system:"))
            .map(role => ({ name: role.metadata.name, kind: 'ClusterRole' }));

        let namespacedRoles = [];
        try {
            const roleResponse = await rbacApi.listNamespacedRole({ namespace });
            namespacedRoles = (roleResponse.items || []).map(role => ({ name: role.metadata.name, kind: 'Role' }));
        } catch (e) {
            console.log(`Could not fetch namespaced roles for ${namespace}: ${e.message}`);
        }

        res.status(200).json([...namespacedRoles, ...clusterRoles]);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Create a custom Role in the namespace via GitOps
export const createRole = async (req, res) => {
    const { namespace } = req.params;
    const { roleName, resources, verbs } = req.body;
    
    const resourcesArray = resources ? resources.split(',').map(s => s.trim()) : [];
    const verbsArray = verbs ? verbs.split(',').map(s => s.trim()) : [];

    try {
        const resource = {
            apiVersion: 'rbac.authorization.k8s.io/v1',
            kind: 'Role',
            metadata: { 
                name: roleName, 
                namespace: namespace 
            },
            rules: [{
                apiGroups: ["", "apps", "batch", "extensions"], 
                resources: resourcesArray,
                verbs: verbsArray
            }]
        };

        // Push to Git instead of direct apply
        await GitOpsHelper.updateRbacFile(resource);

        res.status(201).json({ msg: "Role submitted to GitOps. ArgoCD will sync it shortly." });
    } catch (error) {
        res.status(500).json({ msg: "GitOps Error: " + error.message });
    }
};

// Get all permissions for a specific user across all namespaces
export const getUserPermissions = async (req, res) => {
    const { username } = req.params;
    try {
        const user = await DataPegawai.findOne({
            where: { username: username }
        });

        const userGroups = user?.groups ? user.groups.split(',').map(g => g.trim()) : [];
        const userEmail = user?.email || "";
        const userIdentities = [username, userEmail].filter(t => t !== "");

        // 1. Fetch Namespaced RoleBindings
        const rbResponse = await rbacApi.listRoleBindingForAllNamespaces();
        const roleBindings = rbResponse.items.filter(rb => 
            rb.subjects && rb.subjects.some(s => 
                (s.kind === 'User' && userIdentities.includes(s.name)) || 
                (s.kind === 'Group' && userGroups.includes(s.name))
            )
        ).map(rb => {
            const matchedSubject = rb.subjects.find(s => 
                (s.kind === 'User' && userIdentities.includes(s.name)) || 
                (s.kind === 'Group' && userGroups.includes(s.name))
            );
            return {
                namespace: rb.metadata.namespace,
                roleName: rb.roleRef.name,
                bindingName: rb.metadata.name,
                kind: rb.roleRef.kind,
                subjectName: matchedSubject?.kind === 'User' ? (userEmail || matchedSubject.name) : matchedSubject?.name
            };
        });

        // 2. Fetch ClusterRoleBindings
        const crbResponse = await rbacApi.listClusterRoleBinding();
        const clusterBindings = crbResponse.items.filter(crb => 
            crb.subjects && crb.subjects.some(s => 
                (s.kind === 'User' && userIdentities.includes(s.name)) || 
                (s.kind === 'Group' && userGroups.includes(s.name))
            )
        ).map(crb => {
            const matchedSubject = crb.subjects.find(s => 
                (s.kind === 'User' && userIdentities.includes(s.name)) || 
                (s.kind === 'Group' && userGroups.includes(s.name))
            );
            return {
                namespace: "All Namespaces (Cluster-wide)",
                roleName: crb.roleRef.name,
                bindingName: crb.metadata.name,
                kind: crb.roleRef.kind,
                subjectName: matchedSubject?.kind === 'User' ? (userEmail || matchedSubject.name) : matchedSubject?.name
            };
        });

        // Combine and filter out potential "deprecated" or system bindings if necessary
        const allPermissions = [...roleBindings, ...clusterBindings].filter(p => 
            !p.bindingName.startsWith("system:") // Hide system-managed bindings to reduce noise
        );

        res.status(200).json(allPermissions);
    } catch (error) {
        console.error("Error fetching user permissions:", error.message);
        res.status(500).json({ msg: error.message });
    }
};

// Get all namespaces
export const getNamespaces = async (req, res) => {
    try {
        const response = await k8sApi.listNamespace();
        const namespaces = response.items.map(ns => ns.metadata.name);
        res.status(200).json(namespaces);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};
