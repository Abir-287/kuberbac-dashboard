# Production-ready backend image
FROM node:18-alpine

# Install dumb-init, git for GitOps, and build tools for canvas (node-gyp)
RUN apk add --no-cache dumb-init git openssh \
    python3 make g++ cairo-dev pango-dev jpeg-dev pcre-dev giflib-dev

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
