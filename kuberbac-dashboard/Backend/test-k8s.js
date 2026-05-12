import { k8sApi } from './config/K8sConfig.js';

async function test() {
    try {
        console.log("Fetching Namespaces...");
        const res = await k8sApi.listNamespace();
        console.log("Response keys:", Object.keys(res));
        if (res.body) {
             console.log("Namespaces found:", res.body.items.map(ns => ns.metadata.name));
        } else {
             console.log("No body in response");
             console.log("Full response:", JSON.stringify(res, null, 2));
        }
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Body:", e.response.body);
        }
    }
}

test();
