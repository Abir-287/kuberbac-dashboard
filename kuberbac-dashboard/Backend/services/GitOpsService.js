/**
 * GitOpsService.js
 *
 * When the dashboard creates/updates/deletes a Kubernetes RBAC resource
 * (Role, ClusterRole, RoleBinding, ClusterRoleBinding), this service:
 *   1. Generates the K8s YAML manifest
 *   2. Commits it to GitHub → apps/dev/rbac/{type}/{namespace}-{name}.yaml
 *   3. ArgoCD detects the commit and applies it to the cluster
 *
 * Required env vars:
 *   GITHUB_TOKEN  - PAT with contents:write scope
 *   GITHUB_REPO   - e.g. "Abir-287/kuberbac-dashboard"
 *   GITHUB_RBAC_PATH - e.g. "apps/dev/rbac"
 */

import fetch from 'node-fetch';

const GITHUB_API = 'https://api.github.com';

/**
 * Build YAML content for a Kubernetes RBAC resource
 */
function buildRBACYaml(resourceType, name, namespace, rules = [], subjects = [], roleRef = null) {
    const base = {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: resourceType,
        metadata: { name, ...(namespace ? { namespace } : {}) },
    };

    if (['Role', 'ClusterRole'].includes(resourceType)) {
        base.rules = rules;
    } else {
        base.subjects = subjects;
        base.roleRef = roleRef;
    }

    // Simple YAML serializer (no external deps needed for flat structures)
    return yamlStringify(base);
}

function yamlStringify(obj, indent = 0) {
    const pad = ' '.repeat(indent);
    let out = '';
    for (const [k, v] of Object.entries(obj)) {
        if (Array.isArray(v)) {
            out += `${pad}${k}:\n`;
            for (const item of v) {
                if (typeof item === 'object') {
                    out += `${pad}- ` + Object.entries(item).map(([ik, iv]) => `${ik}: ${iv}`).join('\n  ' + pad + '  ') + '\n';
                } else {
                    out += `${pad}- ${item}\n`;
                }
            }
        } else if (typeof v === 'object' && v !== null) {
            out += `${pad}${k}:\n${yamlStringify(v, indent + 2)}`;
        } else {
            out += `${pad}${k}: ${v}\n`;
        }
    }
    return out;
}

/**
 * Get file SHA from GitHub (needed for updates)
 */
async function getFileSHA(path) {
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
        headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
    });
    if (res.status === 404) return null;
    const data = await res.json();
    return data.sha || null;
}

/**
 * Commit a file to GitHub
 */
async function commitFile(path, content, message) {
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    const sha = await getFileSHA(path);

    const body = {
        message,
        content: Buffer.from(content).toString('base64'),
        ...(sha ? { sha } : {}),
    };

    const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`GitHub commit failed: ${res.status} — ${err}`);
    }
    return res.json();
}

/**
 * Delete a file from GitHub
 */
async function deleteFile(path, message) {
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    const sha = await getFileSHA(path);
    if (!sha) return; // Already gone

    await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
        method: 'DELETE',
        headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, sha }),
    });
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function commitRole(name, namespace, rules) {
    const yaml = buildRBACYaml('Role', name, namespace, rules);
    const filePath = `${process.env.GITHUB_RBAC_PATH}/roles/${namespace}-${name}.yaml`;
    await commitFile(filePath, yaml, `rbac: upsert Role ${namespace}/${name}`);
}

export async function commitClusterRole(name, rules) {
    const yaml = buildRBACYaml('ClusterRole', name, null, rules);
    const filePath = `${process.env.GITHUB_RBAC_PATH}/roles/cluster-${name}.yaml`;
    await commitFile(filePath, yaml, `rbac: upsert ClusterRole ${name}`);
}

export async function commitRoleBinding(name, namespace, subjects, roleRef) {
    const yaml = buildRBACYaml('RoleBinding', name, namespace, [], subjects, roleRef);
    const filePath = `${process.env.GITHUB_RBAC_PATH}/rolebindings/${namespace}-${name}.yaml`;
    await commitFile(filePath, yaml, `rbac: upsert RoleBinding ${namespace}/${name}`);
}

export async function commitClusterRoleBinding(name, subjects, roleRef) {
    const yaml = buildRBACYaml('ClusterRoleBinding', name, null, [], subjects, roleRef);
    const filePath = `${process.env.GITHUB_RBAC_PATH}/rolebindings/cluster-${name}.yaml`;
    await commitFile(filePath, yaml, `rbac: upsert ClusterRoleBinding ${name}`);
}

export async function deleteRBACResource(type, name, namespace) {
    const isCluster = type.startsWith('Cluster');
    const dir = type.includes('Binding') ? 'rolebindings' : 'roles';
    const prefix = isCluster ? 'cluster-' : `${namespace}-`;
    const filePath = `${process.env.GITHUB_RBAC_PATH}/${dir}/${prefix}${name}.yaml`;
    await deleteFile(filePath, `rbac: delete ${type} ${name}`);
}
