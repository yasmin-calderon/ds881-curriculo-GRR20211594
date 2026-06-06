# syntax=docker/dockerfile:1
# Base: Alpine Linux + Node.js 20 LTS (~60MB).
FROM node:20-alpine

# Run as the unprivileged 'node' user (uid 1000) that ships with the image.
# This makes the image's /app/node_modules node-owned, so the anonymous volume
# Compose seeds from it is writable at runtime (Vite creates node_modules/.vite).
WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./

RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 \
    npm config set maxsockets 3 \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 5000 \
 && npm config set fetch-retry-maxtimeout 30000 \
 && npm ci --no-audit --no-fund --prefer-offline

COPY --chown=node:node . .

EXPOSE 8080

CMD ["npm", "run", "dev"]
