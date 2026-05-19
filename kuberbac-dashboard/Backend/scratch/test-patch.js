import * as k8s from '@kubernetes/client-node';
import dotenv from 'dotenv';
dotenv.config();

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sCustomApi = kc.makeApiClient(k8s.CustomObjectsApi);

async function testPatch() {
    try {
        console.log("Attempting JSON patch...");
        const response = await k8sCustomApi.patchNamespacedCustomObject({
            group: "argoproj.io",
            version: "v1alpha1",
            namespace: "argocd",
            plural: "applications",
            name: "rbac-dashboard",
            body: [
                {
                    op: "replace",
                    path: "/metadata/annotations/argocd.argoproj.io~1refresh",
                    value: "hard"
                }
            ]
        }, { headers: { 'Content-Type': 'application/json-patch+json' } });
        console.log("Response Keys:", Object.keys(response));
        console.log("Response Body Name:", response.body?.metadata?.name);
    } catch (e) {
        console.error("Patch failed:", e.message);
        if (e.response) {
            console.error("Response body:", JSON.stringify(e.response.body, null, 2));
        }
    }
}

testPatch();
