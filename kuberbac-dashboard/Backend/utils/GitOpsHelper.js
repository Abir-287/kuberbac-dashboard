import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

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

    async initRepo() {
        if (fs.existsSync(CLONE_DIR)) {
            execSync(`rm -rf ${CLONE_DIR}`);
        }
        console.log(`Cloning ${REPO_URL}...`);
        execSync(`git clone ${this.remoteUrl} ${CLONE_DIR}`);
        
        // Configure git user
        execSync(`git config --global user.email "dashboard-bot@kuberbac.local"`, { cwd: CLONE_DIR });
        execSync(`git config --global user.name "Kuberbac Dashboard Bot"`, { cwd: CLONE_DIR });
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
            execSync(`git add .`, { cwd: CLONE_DIR });
            try {
                execSync(`git commit -m "GitOps: Update RBAC resource ${newResource.metadata.name} (${newResource.kind})"`, { cwd: CLONE_DIR });
                execSync(`git push origin main`, { cwd: CLONE_DIR });
                console.log(`Successfully pushed ${newResource.metadata.name} to Git.`);
            } catch (commitErr) {
                if (commitErr.stdout?.toString().includes("nothing to commit")) {
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
            // Cleanup
            if (fs.existsSync(CLONE_DIR)) {
                execSync(`rm -rf ${CLONE_DIR}`);
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
            execSync(`git add .`, { cwd: CLONE_DIR });
            try {
                execSync(`git commit -m "GitOps: Delete RBAC resource ${name} (${kind})"`, { cwd: CLONE_DIR });
                execSync(`git push origin main`, { cwd: CLONE_DIR });
                console.log(`Successfully deleted ${name} from Git.`);
            } catch (commitErr) {
                if (commitErr.stdout?.toString().includes("nothing to commit")) {
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
                execSync(`rm -rf ${CLONE_DIR}`);
            }
        }
    }
}

export default new GitOpsHelper();
