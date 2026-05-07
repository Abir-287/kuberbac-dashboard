import { rbacApi } from '../config/K8sConfig.js';

async function checkBindings() {
    try {
        console.log("Fetching all RoleBindings...");
        const response = await rbacApi.listRoleBindingForAllNamespaces();
        console.log(`Found ${response.items.length} RoleBindings.`);
        
        response.items.forEach(rb => {
            if (rb.subjects) {
                rb.subjects.forEach(s => {
                    console.log(`- Namespace: ${rb.metadata.namespace}, Name: ${rb.metadata.name}, Subject: ${s.name} (${s.kind})`);
                });
            }
        });
        process.exit(0);
    } catch (error) {
        console.error("Failed to fetch bindings:", error.response?.body || error);
        process.exit(1);
    }
}

checkBindings();
