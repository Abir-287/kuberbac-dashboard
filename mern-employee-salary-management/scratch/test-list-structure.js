import { k8sApi } from "../Backend/config/K8sConfig.js";

async function test() {
    try {
        const response = await k8sApi.listNamespace();
        console.log("Keys in list response:", Object.keys(response));
        if (response.items) {
             console.log("Found items directly. Length:", response.items.length);
        } else if (response.body && response.body.items) {
             console.log("Found items in body. Length:", response.body.items.length);
        } else {
             console.log("Could not find items.");
             console.log("Keys in response:", Object.keys(response));
        }
    } catch (error) {
        console.error("Error details:", error);
    }
}

test();
