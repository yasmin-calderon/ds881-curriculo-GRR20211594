# syntax=docker/dockerfile:1
FROM node:24-alpine

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
