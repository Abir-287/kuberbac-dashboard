import * as k8s from '@kubernetes/client-node';

const kc = new k8s.KubeConfig();

if (process.env.KUBERNETES_SERVICE_HOST) {
    // We are inside the cluster
    kc.loadFromCluster();
} else {
    // We are outside (local dev)
    try {
        kc.loadFromDefault();
        // Only switch if we're local and have the context
        if (kc.getContexts().some(c => c.name === 'kubernetes-admin@kubernetes')) {
            kc.setCurrentContext('kubernetes-admin@kubernetes');
        }
    } catch (e) {
        console.error("Could not load KubeConfig:", e.message);
    }
}

export const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
export const rbacApi = kc.makeApiClient(k8s.RbacAuthorizationV1Api);
export const k8sCustomApi = kc.makeApiClient(k8s.CustomObjectsApi);
export default kc;
