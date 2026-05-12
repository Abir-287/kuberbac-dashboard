import { rbacApi } from "../Backend/config/K8sConfig.js";

async function test() {
    try {
        const response = await rbacApi.listRoleBindingForAllNamespaces();
        console.log("Keys in RB list response:", Object.keys(response));
        if (response.items) {
             console.log("Found RB items directly. Length:", response.items.length);
        } else {
             console.log("Could not find RB items directly.");
        }
    } catch (error) {
        console.error("Error details:", error);
    }
}

test();
