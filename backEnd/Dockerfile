# Debian, not Alpine: the Agent SDK's agent binary is the glibc build.
FROM node:24-bookworm-slim AS build
WORKDIR /app
# Dependencies are always installed here, never copied from the host: the SDK
# pulls a different agent binary per platform (darwin on the Mac, linux here).
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY scripts ./scripts
COPY src ./src
RUN npm run build

FROM node:24-bookworm-slim
# The agent's WebSearch/WebFetch call HTTPS sites.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# The agent keeps its sessions in ~/.elber/agent (a volume in compose). Created
# here so the volume starts owned by the node user, not by root.
RUN mkdir -p /home/node/.elber/agent && chown -R node:node /home/node/.elber
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
