# Production-ready backend image
FROM node:18-alpine

# Install dumb-init and git for GitOps handling
RUN apk add --no-cache dumb-init git openssh

WORKDIR /app

# Copy and install deps first (layer cache optimization)
COPY package*.json ./
RUN npm ci --only=production

# Copy application source (excluding node_modules, .env, test files)
COPY . .

EXPOSE 5000

# Use dumb-init to handle PID 1 signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "index.js"]
