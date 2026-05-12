import { k8sApi } from "../Backend/config/K8sConfig.js";

async function test() {
    try {
        const response = await k8sApi.readNamespace({ name: "default" });
        console.log("Keys in response:", Object.keys(response));
        if (response.body) {
            console.log("Keys in response.body:", Object.keys(response.body));
        } else {
            console.log("response.body is undefined");
            console.log("Full response structure:", JSON.stringify(response).substring(0, 500));
        }
    } catch (error) {
        console.error("Error details:", error);
    }
}

test();
