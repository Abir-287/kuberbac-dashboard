import * as k8s from '@kubernetes/client-node';

const kc = new k8s.KubeConfig();
try {
    kc.loadFromDefault();
    // Switch to the admin context which uses certificates instead of interactive kubelogin
    kc.setCurrentContext('kubernetes-admin@kubernetes');
} catch (e) {
    console.error("Could not load KubeConfig:", e.message);
}

export const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
export const rbacApi = kc.makeApiClient(k8s.RbacAuthorizationV1Api);
export default kc;
