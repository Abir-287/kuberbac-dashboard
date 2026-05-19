import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { k8sCustomApi } from '../config/K8sConfig.js';

const execAsync = util.promisify(exec);

const REPO_URL = process.env.GITHUB_REPO; // e.g., Abir-287/kuberbac-dashboard
const TOKEN = process.env.GITHUB_TOKEN;
const USER = process.env.GITHUB_USER;
const RBAC_PATH = process.env.GITHUB_RBAC_PATH || 'apps/dev/rbac';
const FILE_NAME = 'managed-rbac.yaml';
const CLONE_DIR = '/tmp/gitops-repo';

class GitOpsHelper {
    constructor() {
        this.remoteUrl = `https://${USER}:${TOKEN}@github.com/${REPO_URL}.git`;
        this.filePath = path.join(CLONE_DIR, RBAC_PATH, FILE_NAME);
    }

    async forceArgoCDSync() {
        try {
            console.log("Forcing ArgoCD Sync via Kubernetes Patch...");
            // Patch the Application resource in the argocd namespace
            // argocd.argoproj.io/refresh: hard annotation triggers a sync
            await k8sCustomApi.patchNamespacedCustomObject({
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
            }, {
                headers: { 'Content-Type': 'application/json-patch+json' }
            });
            console.log("ArgoCD Sync triggered successfully.");
        } catch (error) {
            console.error("Failed to trigger ArgoCD Sync:", error.message);
            // Don't throw, Git push was already successful
        }
    }

    async initRepo() {
        if (fs.existsSync(CLONE_DIR)) {
            await execAsync(`rm -rf ${CLONE_DIR}`);
        }
        console.log(`Cloning ${REPO_URL}...`);
        await execAsync(`git clone ${this.remoteUrl} ${CLONE_DIR}`);
        
        // Configure git user
        await execAsync(`git config --global user.email "dashboard-bot@kuberbac.local"`, { cwd: CLONE_DIR });
        await execAsync(`git config --global user.name "Kuberbac Dashboard Bot"`, { cwd: CLONE_DIR });
    }

    async updateRbacFile(newResource) {
        try {
            await this.initRepo();

            let resources = [];
            if (fs.existsSync(this.filePath)) {
                const fileContent = fs.readFileSync(this.filePath, 'utf8');
                // Load all documents from the YAML file
                resources = yaml.loadAll(fileContent).filter(doc => doc !== null);
            }

            // Check if resource already exists (by name and kind) and update it, otherwise push new
            const index = resources.findIndex(r => 
                r.metadata.name === newResource.metadata.name && 
                r.kind === newResource.kind &&
                r.metadata.namespace === newResource.metadata.namespace
            );

            if (index !== -1) {
                resources[index] = newResource;
            } else {
                resources.push(newResource);
            }

            // Ensure directory exists
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Write back as multi-document YAML
            const yamlContent = resources.map(r => yaml.dump(r)).join('---\n');
            fs.writeFileSync(this.filePath, yamlContent);

            // Commit and Push
            await execAsync(`git add .`, { cwd: CLONE_DIR });
            try {
                await execAsync(`git commit -m "GitOps: Update RBAC resource ${newResource.metadata.name} (${newResource.kind})"`, { cwd: CLONE_DIR });
                await execAsync(`git push origin main`, { cwd: CLONE_DIR });
                console.log(`Successfully pushed ${newResource.metadata.name} to Git.`);
                
                // Trigger ArgoCD Sync immediately
                await this.forceArgoCDSync();
            } catch (commitErr) {
                if (commitErr.stdout?.toString().includes("nothing to commit") || commitErr.message?.includes("nothing to commit")) {
                    console.log("No changes to commit.");
                } else {
                    throw commitErr;
                }
            }

            return true;
        } catch (error) {
            console.error("GitOps Update Failed:", error.message);
            throw error;
        } finally {
            if (fs.existsSync(CLONE_DIR)) {
                await execAsync(`rm -rf ${CLONE_DIR}`).catch(() => {});
            }
        }
    }

    async deleteRbacResource(kind, name, namespace) {
        try {
            await this.initRepo();

            if (!fs.existsSync(this.filePath)) {
                console.log(`RBAC file ${this.filePath} does not exist.`);
                return false;
            }

            const fileContent = fs.readFileSync(this.filePath, 'utf8');
            let resources = yaml.loadAll(fileContent).filter(doc => doc !== null);

            const initialLength = resources.length;
            
            // Filter out the resource to delete
            resources = resources.filter(r => 
                !(r.metadata.name === name && 
                  r.kind === kind &&
                  r.metadata.namespace === namespace)
            );

            if (resources.length === initialLength) {
                console.log(`Resource ${name} of kind ${kind} not found in ${this.filePath}.`);
                return false;
            }

            // Write back as multi-document YAML
            const yamlContent = resources.map(r => yaml.dump(r)).join('---\n');
            fs.writeFileSync(this.filePath, yamlContent);

            // Commit and Push
            await execAsync(`git add .`, { cwd: CLONE_DIR });
            try {
                await execAsync(`git commit -m "GitOps: Delete RBAC resource ${name} (${kind})"`, { cwd: CLONE_DIR });
                await execAsync(`git push origin main`, { cwd: CLONE_DIR });
                console.log(`Successfully deleted ${name} from Git.`);

                // Trigger ArgoCD Sync immediately
                await this.forceArgoCDSync();
            } catch (commitErr) {
                if (commitErr.stdout?.toString().includes("nothing to commit") || commitErr.message?.includes("nothing to commit")) {
                    console.log("No changes to commit.");
                } else {
                    throw commitErr;
                }
            }

            return true;
        } catch (error) {
            console.error("GitOps Deletion Failed:", error.message);
            throw error;
        } finally {
            if (fs.existsSync(CLONE_DIR)) {
                await execAsync(`rm -rf ${CLONE_DIR}`).catch(() => {});
            }
        }
    }
}

export default new GitOpsHelper();
