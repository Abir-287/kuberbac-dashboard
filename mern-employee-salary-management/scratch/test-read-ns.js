import { k8sApi } from "../Backend/config/K8sConfig.js";

async function test() {
    try {
        const response = await k8sApi.readNamespace("default");
        console.log("Success with string:", response.body.metadata.name);
    } catch (error) {
        console.log("Failed with string:", error.message);
    }

    try {
        const response = await k8sApi.readNamespace({ name: "default" });
        console.log("Success with object:", response.body.metadata.name);
    } catch (error) {
        console.log("Failed with object:", error.message);
    }
}

test();
