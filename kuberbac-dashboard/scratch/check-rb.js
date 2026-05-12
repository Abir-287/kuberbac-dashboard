import { rbacApi } from "../Backend/config/K8sConfig.js";

async function test() {
    try {
        const response = await rbacApi.listRoleBindingForAllNamespaces();
        console.log(`Found ${response.items.length} RoleBindings`);
        response.items.slice(0, 5).forEach(rb => {
            console.log(`- ${rb.metadata.name} in ${rb.metadata.namespace}`);
        });
    } catch (error) {
        console.error("Error:", error.message);
    }
}

test();
