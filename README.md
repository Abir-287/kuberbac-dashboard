# KuberBAC Dashboard

A **Kubernetes RBAC Management Dashboard** that provides a web interface for managing users, namespaces, Role-Based Access Control (RBAC) policies, and Kubernetes cluster resources. It integrates with **Keycloak** for identity management and uses a **GitOps** workflow via **ArgoCD** to apply RBAC changes to the cluster.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Infrastructure Setup](#infrastructure-setup)
  - [1. Kubernetes Cluster](#1-kubernetes-cluster)
  - [2. Keycloak (OIDC Identity Provider)](#2-keycloak-oidc-identity-provider)
  - [3. Dex (OIDC Proxy)](#3-dex-oidc-proxy)
  - [4. ArgoCD (GitOps Controller)](#4-argocd-gitops-controller)
  - [5. Sealed Secrets](#5-sealed-secrets)
  - [6. MySQL Database](#6-mysql-database)
- [Repository Structure](#repository-structure)
- [Configuration](#configuration)
  - [Backend Environment Variables](#backend-environment-variables)
  - [Kubernetes Secrets](#kubernetes-secrets)
  - [GitOps Configuration](#gitops-configuration)
- [Local Development](#local-development)
  - [Backend (Node.js)](#backend-nodejs)
  - [Frontend (React / Vite)](#frontend-react--vite)
- [Cluster Deployment (Production)](#cluster-deployment-production)
  - [1. Register the ArgoCD Application](#1-register-the-argocd-application)
  - [2. Apply the GitHub Container Registry Pull Secret](#2-apply-the-github-container-registry-pull-secret)
  - [3. Apply Sealed Secrets](#3-apply-sealed-secrets)
  - [4. Push and Deploy via CI/CD](#4-push-and-deploy-via-cicd)
- [CI/CD Pipeline](#cicd-pipeline)
- [GitOps RBAC Workflow](#gitops-rbac-workflow)
- [API Reference](#api-reference)
- [Keycloak Configuration Reference](#keycloak-configuration-reference)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────┐     HTTPS      ┌──────────────────────────────────────────────┐
│   Browser   │ ─────────────► │           NGINX Ingress (MetalLB)            │
└─────────────┘                └───────────────┬──────────────────────────────┘
                                               │
                         ┌─────────────────────┼─────────────────────┐
                         ▼                     ▼                     ▼
                  ┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
                  │  Frontend   │     │   Backend    │     │     ArgoCD UI    │
                  │  (React)    │     │  (Node.js)   │     │                  │
                  └─────────────┘     └──────┬───────┘     └──────────────────┘
                                             │
                         ┌───────────────────┼───────────────────┐
                         ▼                   ▼                   ▼
                  ┌─────────────┐   ┌──────────────┐   ┌──────────────────┐
                  │  Keycloak   │   │    MySQL DB   │   │  Kubernetes API  │
                  │  (OIDC IdP) │   │  (Sessions/  │   │  (RBAC / Pods /  │
                  └─────────────┘   │   Users)     │   │   Namespaces)    │
                         │          └──────────────┘   └──────────────────┘
                         ▼
                  ┌─────────────┐
                  │     Dex     │   ◄── kube-apiserver uses Dex as OIDC issuer
                  │ (OIDC Proxy)│
                  └─────────────┘

GitOps flow:
  Backend ──push──► GitHub Repo ──sync──► ArgoCD ──apply──► Kubernetes Cluster
```

---

## Features

| Feature | Description |
|---|---|
| **User Management** | Create, update, and delete users synced bidirectionally with Keycloak |
| **Namespace Browser** | View all Kubernetes namespaces from the cluster |
| **Pod Viewer** | List pods in any namespace |
| **RBAC Management** | Assign `ClusterRole` and namespace-scoped `Role` bindings to users/groups |
| **Custom Role Creation** | Create new namespace-scoped `Role` objects with fine-grained permissions |
| **User Permissions View** | View all RBAC bindings for a given user across all namespaces |
| **GitOps Enforcement** | All RBAC changes are committed to Git and applied by ArgoCD, not directly |
| **Keycloak Sync** | Backend polls Keycloak every 5 minutes to keep the local user table in sync |
| **Session Auth** | Cookie-based session auth backed by MySQL via `connect-session-sequelize` |

---

## Prerequisites

### Required Infrastructure

| Component | Minimum Version | Purpose |
|---|---|---|
| Kubernetes cluster | 1.24+ | Target cluster for RBAC management |
| Keycloak | 21+ | Identity provider and user directory |
| Dex | 2.x | OIDC proxy between Kubernetes API server and Keycloak |
| ArgoCD | 2.x | GitOps controller that applies manifests from this repository |
| MySQL / MariaDB | 8.0+ | Backend session store and local user cache |
| Sealed Secrets | 0.18+ | Encrypted Kubernetes secrets stored safely in Git |
| MetalLB | 0.13+ | LoadBalancer for the NGINX Ingress |
| NGINX Ingress Controller | 1.x | TLS termination and routing |

### Required Tools (local machine)

| Tool | Purpose |
|---|---|
| `kubectl` | Interact with the cluster |
| `kubeseal` | Encrypt secrets for Sealed Secrets |
| `git` | Required for the backend to push RBAC changes |
| `node` 18+ | Run backend and frontend locally |
| `docker` | Build container images |

---

## Infrastructure Setup

### 1. Kubernetes Cluster

The backend runs inside the cluster via a `ServiceAccount` with RBAC permissions to read/write `Role`, `RoleBinding`, and `ClusterRoleBinding` resources. The `ServiceAccount` manifest is located at `apps/dev/rbac/`.

> **Important**: The backend pod is deployed to `worker1` (via `nodeSelector`). Adjust `apps/dev/backend/deployment.yaml` if your node name is different.

### 2. Keycloak (OIDC Identity Provider)

The backend connects to Keycloak to manage users. Configure the following in your Keycloak instance:

1. Create a **realm** named `kubernetes`.
2. Create a **client** named `kubernetes_oidc` with:
   - Client Authentication: **On**
   - Valid Redirect URIs: `http://localhost:8000/*` (for Dex callback)
   - A client secret (needed for Dex config)
3. Create Keycloak groups to control RBAC:
   - `cluster-admins` → users in this group get `hak_akses: admin` in the dashboard
   - Any other group (e.g. `developers`, `devs`) → regular users
4. Add a **groups protocol mapper** to the client so the `groups` claim is included in the ID token.

The backend reads the Keycloak Admin API using the credentials configured in `services/KeycloakSync.js`:

```
KEYCLOAK_URL  = https://<your-keycloak-host>:8443
REALM         = kubernetes
ADMIN_USER    = admin
ADMIN_PASS    = <your-keycloak-admin-password>
```

> **Note**: Update these values in `kuberbac-dashboard/Backend/services/KeycloakSync.js` before deployment. In production, these should be injected as environment variables via a Kubernetes Secret.

### 3. Dex (OIDC Proxy)

Dex acts as the OIDC issuer for the Kubernetes API server. It connects upstream to Keycloak.

Configure the kube-apiserver with these OIDC flags:

```
--oidc-issuer-url=https://<dex-ip>:5556
--oidc-client-id=kubernetes_oidc
--oidc-username-claim=email
--oidc-groups-claim=groups
--oidc-ca-file=/etc/kubernetes/pki/dex-ca.crt
```

Use `kuberbac-dashboard/update_dex_certs.sh` to regenerate Dex TLS certificates on the Dex VM if they expire.

### 4. ArgoCD (GitOps Controller)

ArgoCD watches this Git repository and syncs the `apps/dev/` directory to the `rbac-dashboard` namespace.

**Install ArgoCD:**
```bash
bash kuberbac-dashboard/install_argocd.sh
```

**Register the application:**
```bash
kubectl apply -f argocd/application.yaml
```

ArgoCD is configured to:
- **Auto-sync** with self-heal enabled
- **Prune** resources removed from Git
- Retry up to 3 times on failure

### 5. Sealed Secrets

Secrets in this repo are encrypted using [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets). The cluster's Sealed Secrets controller decrypts them at apply time.

> **Important**: The encrypted secrets in `apps/dev/backend/secret.yaml` and `apps/dev/mysql/` are bound to the original cluster's controller key. If you are deploying to a **new cluster**, you must re-seal the secrets using your new cluster's public key.

**To re-seal a secret:**
```bash
# Get the new cluster's public key
kubeseal --fetch-cert --controller-namespace kube-system > pub-cert.pem

# Create a plain secret manifest (do not commit this file!)
kubectl create secret generic backend-secret \
  --from-literal=SESS_SECRET='<your-session-secret>' \
  --from-literal=GITHUB_TOKEN='<your-github-pat>' \
  --namespace=rbac-dashboard \
  --dry-run=client -o yaml > backend-secret-plain.yaml

# Seal it
kubeseal --format=yaml --cert=pub-cert.pem < backend-secret-plain.yaml > apps/dev/backend/secret.yaml

# Delete the plain file immediately
rm backend-secret-plain.yaml
```

### 6. MySQL Database

The backend requires a MySQL database. The MySQL deployment is included in `apps/dev/mysql/` and is managed by ArgoCD.

The database name defaults to `cluster_dashboard_db`. The `DataPegawai` model (user table) is created automatically by Sequelize on first startup via `db.sync()`.

**Required database credentials** (set via ConfigMap + Secret):

| Variable | Description |
|---|---|
| `DB_HOST` | MySQL hostname (e.g. `mysql-service`) |
| `DB_NAME` | Database name (`cluster_dashboard_db`) |
| `DB_USER` | MySQL username |
| `DB_PASS` | MySQL password (from `mysql-secret`) |

---

## Repository Structure

```
dashboard-rbac/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD: build → push to GHCR → update manifests
├── apps/
│   └── dev/                        # ArgoCD watches this directory
│       ├── backend/
│       │   ├── configmap.yaml      # Non-secret env vars (DB_HOST, DB_NAME, etc.)
│       │   ├── deployment.yaml     # Backend pod spec (auto-updated by CI)
│       │   ├── secret.yaml         # Sealed Secret (SESS_SECRET, GITHUB_TOKEN)
│       │   └── service.yaml        # ClusterIP service on port 5000
│       ├── frontend/
│       │   ├── deployment.yaml     # Frontend pod spec (auto-updated by CI)
│       │   └── service.yaml        # ClusterIP service on port 80
│       ├── mysql/                  # MySQL StatefulSet + PVC + services
│       ├── rbac/
│       │   └── managed-rbac.yaml   # GitOps-managed RBAC resources (auto-updated by backend)
│       ├── ingress.yaml            # NGINX Ingress with TLS
│       ├── namespace.yaml          # rbac-dashboard namespace definition
│       └── tls-secret.yaml         # Sealed TLS certificate
├── argocd/
│   └── application.yaml            # ArgoCD Application CRD pointing to apps/dev/
├── kuberbac-dashboard/
│   ├── Backend/                    # Node.js / Express API server
│   │   ├── config/
│   │   │   ├── Database.js         # Sequelize connection (reads .env)
│   │   │   └── K8sConfig.js        # Kubernetes client (in-cluster or kubeconfig)
│   │   ├── controllers/
│   │   │   ├── Auth.js             # Login, logout, /me, change-password
│   │   │   ├── NamespaceController.js  # Namespace and Pod endpoints
│   │   │   ├── RbacController.js   # RBAC: roles, bindings, user-permissions
│   │   │   └── UserController.js   # CRUD users (synced to Keycloak)
│   │   ├── middleware/
│   │   │   └── AuthUser.js         # verifyUser + adminOnly middleware
│   │   ├── models/
│   │   │   └── DataPegawaiModel.js # Sequelize user model
│   │   ├── routes/
│   │   │   ├── AuthRoute.js        # /login, /logout, /me, /change-password
│   │   │   └── UserRoute.js        # All /data_pegawai, /data_jabatan, /rbac/* routes
│   │   ├── services/
│   │   │   ├── GitOpsService.js    # Git clone → update YAML → push
│   │   │   └── KeycloakSync.js     # Keycloak admin API: create/update/delete/sync users
│   │   ├── utils/
│   │   │   └── GitOpsHelper.js     # Git operations + ArgoCD force-sync via K8s patch
│   │   ├── Dockerfile
│   │   ├── index.js                # Express app entry point
│   │   └── package.json
│   ├── Frontend/                   # React + Vite + TailwindCSS SPA
│   │   ├── src/
│   │   │   ├── pages/              # Dashboard pages (Users, Namespaces, RBAC, ArgoCD...)
│   │   │   ├── components/         # Reusable UI components
│   │   │   └── store/              # Redux state management
│   │   ├── Dockerfile
│   │   ├── nginx.conf              # NGINX config for serving the SPA
│   │   └── package.json
│   ├── install_argocd.sh           # One-time ArgoCD installation script
│   ├── update_dex_certs.sh         # Dex TLS certificate regeneration script
│   └── LICENSE
└── cleanup-pod.yaml                # Optional: Job to clean up stale resources
```

---

## Configuration

### Backend Environment Variables

Create `kuberbac-dashboard/Backend/.env` for local development:

```env
# Server
APP_PORT=5000
SESS_SECRET=<a-long-random-string>

# Database
DB_HOST=localhost
DB_NAME=cluster_dashboard_db
DB_USER=<mysql-username>
DB_PASS=<mysql-password>

# GitHub (for GitOps RBAC pushes)
GITHUB_TOKEN=<github-personal-access-token>
GITHUB_USER=<github-username>
GITHUB_REPO=<github-org-or-user>/<repo-name>
GITHUB_RBAC_PATH=apps/dev/rbac
```

> **Never commit `.env` to Git.** It is already listed in `.gitignore`.

### Kubernetes Secrets

In the cluster, secrets are injected via a Kubernetes `SealedSecret` (`apps/dev/backend/secret.yaml`). The backend reads these as standard environment variables:

| Secret Key | Description |
|---|---|
| `SESS_SECRET` | Express session signing secret |
| `GITHUB_TOKEN` | GitHub PAT with `repo` scope (for GitOps pushes) |

The MySQL password is provided via `mysql-secret` (also a SealedSecret in `apps/dev/mysql/`).

### GitOps Configuration

The backend's GitOps helper (`utils/GitOpsHelper.js`) uses these env vars:

| Variable | Default | Description |
|---|---|---|
| `GITHUB_REPO` | — | GitHub repo path, e.g. `MyOrg/my-repo` |
| `GITHUB_TOKEN` | — | PAT with `repo` write access |
| `GITHUB_USER` | — | GitHub username used in the Git remote URL |
| `GITHUB_RBAC_PATH` | `apps/dev/rbac` | Path within the repo where `managed-rbac.yaml` lives |

When a user assigns a role via the dashboard, the backend:
1. Clones the repo to `/tmp/gitops-repo`
2. Reads `apps/dev/rbac/managed-rbac.yaml`
3. Appends or updates the RBAC resource
4. Commits and pushes
5. Patches the ArgoCD `Application` resource to trigger an immediate sync

---

## Local Development

### Backend (Node.js)

**Requirements:** Node.js 18+, a running MySQL instance, network access to your Keycloak instance.

```bash
cd kuberbac-dashboard/Backend

# Install dependencies
npm install

# Create .env (see Configuration section above)
cp .env .env.local  # fill in values

# Start the development server (nodemon, auto-restart on changes)
npm start
```

The API will be available at `http://localhost:5000`.

> **Kubernetes access**: For local development, the backend loads your local `~/.kube/config` and uses the `kubernetes-admin@kubernetes` context. Make sure this context exists and has cluster access.

### Frontend (React / Vite)

**Requirements:** Node.js 18+, backend running at `http://localhost:5000`.

```bash
cd kuberbac-dashboard/Frontend

# Install dependencies
npm install
# or: yarn install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

The frontend proxies API requests to the backend. If you change the backend port, update `vite.config.js` accordingly.

---

## Cluster Deployment (Production)

### 1. Register the ArgoCD Application

```bash
kubectl apply -f argocd/application.yaml
```

This tells ArgoCD to watch the `apps/dev/` directory of this repository and sync all resources to the `rbac-dashboard` namespace.

### 2. Apply the GitHub Container Registry Pull Secret

The cluster needs credentials to pull the container images from GHCR:

```bash
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=<github-username> \
  --docker-password=<github-pat> \
  --namespace=rbac-dashboard
```

### 3. Apply Sealed Secrets

If deploying to the same cluster where the secrets were originally sealed, ArgoCD will apply them automatically. If deploying to a **new cluster**, re-seal the secrets as described in the [Sealed Secrets](#5-sealed-secrets) section.

### 4. Push and Deploy via CI/CD

Any push to the `main` branch that modifies files under `kuberbac-dashboard/Backend/**` or `kuberbac-dashboard/Frontend/**` triggers the CI/CD pipeline automatically. See [CI/CD Pipeline](#cicd-pipeline) for details.

**Required GitHub repository secrets** (set in **Settings → Secrets → Actions**):

| Secret Name | Description |
|---|---|
| `GITHUB_TOKEN` | Automatically provided by GitHub Actions — no setup needed |

The images are published to the **GitHub Container Registry** (GHCR) under your account. Make sure the repository packages visibility is set to **public**, or the cluster pull secret has the correct credentials.

---

## CI/CD Pipeline

File: `.github/workflows/deploy.yml`

**Trigger:** Push to `main` branch with changes in `kuberbac-dashboard/Backend/**` or `kuberbac-dashboard/Frontend/**`.

**Steps:**

```
1. Checkout repository
2. Login to GHCR
3. Build and push Backend Docker image  →  ghcr.io/<user>/kuberbac-backend:<sha>
4. Build and push Frontend Docker image →  ghcr.io/<user>/kuberbac-frontend:<sha>
5. Update image tags in apps/dev/backend/deployment.yaml
                      and apps/dev/frontend/deployment.yaml
6. Commit and push the updated manifests to main
   (retries up to 5 times to handle concurrent pushes)
```

ArgoCD detects the manifest change and automatically rolls out the new pods.

---

## GitOps RBAC Workflow

```
Dashboard User (Admin)
        │
        │  POST /rbac/bindings/:namespace
        ▼
  Backend API (RbacController)
        │
        │  GitOpsHelper.updateRbacFile(resource)
        ▼
  Clone GitHub repo → update apps/dev/rbac/managed-rbac.yaml → commit → push
        │
        │  Patch ArgoCD Application (force sync)
        ▼
  ArgoCD detects change → kubectl apply → RoleBinding created in cluster
```

For **delete** operations, the backend simultaneously:
1. Calls the Kubernetes API directly (`rbacApi.deleteNamespacedRoleBinding`) for immediate UI feedback.
2. Removes the resource from `managed-rbac.yaml` in Git (async) so ArgoCD stays in sync.

---

## API Reference

All routes are served under the root path. Authentication is cookie-based (session).

### Auth

| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/login` | No | Login with username + password |
| `GET` | `/me` | No | Returns current session user |
| `DELETE` | `/logout` | No | Destroy session |
| `PATCH` | `/change_password` | Yes (any user) | Change own password |

**Login request body:**
```json
{ "username": "admin", "password": "yourpassword" }
```

### Users

| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/data_pegawai` | Admin | List all users |
| `GET` | `/data_pegawai/id/:id` | Admin | Get user by ID |
| `GET` | `/data_pegawai/name/:name` | Any user | Get user by name |
| `POST` | `/data_pegawai` | Admin | Create user (also creates in Keycloak) |
| `PATCH` | `/data_pegawai/:id` | Admin | Update user (also updates in Keycloak) |
| `DELETE` | `/data_pegawai/:id` | Admin | Delete user (also deletes in Keycloak) |

**Create user request body:**
```json
{
  "nama_pegawai": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "hak_akses": "pegawai",
  "groups": "developers"
}
```

### Namespaces & Pods

| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/data_jabatan` | Admin | List all Kubernetes namespaces |
| `POST` | `/data_jabatan` | Admin | Create a namespace |
| `DELETE` | `/data_jabatan/:id` | Admin | Delete a namespace |
| `GET` | `/namespaces/:name/pods` | Admin | List pods in a namespace |
| `GET` | `/pods/all` | Admin | List all pods across all namespaces |

### RBAC

| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/rbac/namespaces` | Admin | List all namespaces |
| `GET` | `/rbac/roles/:namespace` | Admin | List available roles in a namespace |
| `GET` | `/rbac/bindings/:namespace` | Admin | List RoleBindings in a namespace |
| `POST` | `/rbac/bindings/:namespace` | Admin | Create a RoleBinding via GitOps |
| `DELETE` | `/rbac/bindings/:namespace/:name` | Admin | Delete a RoleBinding |
| `POST` | `/rbac/custom-roles/:namespace` | Admin | Create a custom Role via GitOps |
| `GET` | `/rbac/user-permissions/:username` | Any user | Get all permissions for a user |

**Create RoleBinding request body:**
```json
{
  "username": "johndoe",
  "roleName": "view",
  "roleKind": "ClusterRole",
  "bindingName": "johndoe-view-binding",
  "subjectKind": "User"
}
```

**Create custom Role request body:**
```json
{
  "roleName": "pod-reader",
  "resources": "pods,pods/log",
  "verbs": "get,list,watch"
}
```

---

## Keycloak Configuration Reference

| Setting | Value |
|---|---|
| Realm | `kubernetes` |
| Client ID | `kubernetes_oidc` |
| Client Protocol | `openid-connect` |
| Token Endpoint Auth Method | `client-secret` |
| Groups claim name | `groups` |
| Admin group (gives dashboard admin) | `cluster-admins` |

The backend Admin API credentials (`ADMIN_USER` / `ADMIN_PASS`) must have permission to manage users in the `kubernetes` realm. Assign the `realm-admin` client role from `realm-management` to your admin user.

---

## Troubleshooting

### Backend cannot connect to Keycloak

- Verify Keycloak is reachable from the backend pod: `kubectl exec -n rbac-dashboard <backend-pod> -- curl -k https://<keycloak-host>:8443`
- Check that `NODE_TLS_REJECT_UNAUTHORIZED=0` is set (already set in `KeycloakSync.js` for self-signed certs)
- Confirm the admin credentials in `services/KeycloakSync.js` are correct

### GitOps push fails

- Verify `GITHUB_TOKEN` is set in the backend pod environment: `kubectl exec -n rbac-dashboard <backend-pod> -- env | grep GITHUB`
- The PAT must have `repo` (or `contents: write`) scope on this repository
- Check backend logs: `kubectl logs -n rbac-dashboard deployment/backend`

### ArgoCD is out of sync

- Check ArgoCD UI at `https://argocd.abir.local` or your configured domain
- Run a manual sync: `kubectl patch application rbac-dashboard -n argocd --type merge -p '{"metadata":{"annotations":{"argocd.argoproj.io/refresh":"hard"}}}'`

### Database connection error on startup

- Confirm the MySQL pod is running: `kubectl get pods -n rbac-dashboard`
- Verify `DB_HOST` in the backend ConfigMap matches the MySQL service name
- Check that the MySQL credentials in the SealedSecret match what the database expects

### Frontend shows 502 Bad Gateway

- The backend is not ready yet. Check readiness probe: `kubectl describe pod -n rbac-dashboard -l app=backend`
- The backend has a 90-second initial delay for the liveness probe (Keycloak sync on startup)

### Sealed Secrets not decrypting

- The SealedSecret was created for a different cluster. You must re-seal secrets with your cluster's public key (see [Sealed Secrets](#5-sealed-secrets) section)
- Check controller logs: `kubectl logs -n kube-system -l app.kubernetes.io/name=sealed-secrets`

---

## License

MIT License — see [LICENSE](kuberbac-dashboard/LICENSE) for details.
