import { rbacApi } from "../Backend/config/K8sConfig.js";

async function test() {
    try {
        const response = await rbacApi.readNamespacedRoleBinding({ name: "abir-ben-nasr-admin-binding", namespace: "abir" });
        console.log("Binding:", response.metadata.name);
        console.log("Subjects:", JSON.stringify(response.subjects, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
    }
}

test();
