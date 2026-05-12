import * as k8s from '@kubernetes/client-node';

async function testK8s() {
    const kc = new k8s.KubeConfig();
    try {
        kc.loadFromDefault();
        kc.setCurrentContext('kubernetes-admin@kubernetes');
        const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
        
        console.log("Attempting to list namespaces...");
        const response = await k8sApi.listNamespace();
        console.log("Response type:", typeof response);
        console.log("Response keys:", Object.keys(response));
        
        // In @kubernetes/client-node 1.x+, the response IS the object if using the new API
        // But listNamespace might still return { body, response } in some wrappers?
        
        if (response.items) {
             console.log("Success! Found", response.items.length, "namespaces via .items");
        } else if (response.body && response.body.items) {
             console.log("Success! Found", response.body.items.length, "namespaces via .body.items");
        } else {
             console.log("Unexpected response structure:", JSON.stringify(response).substring(0, 200));
        }
    } catch (e) {
        console.error("K8s Error:");
        console.error(e.message);
    }
}

testK8s();
