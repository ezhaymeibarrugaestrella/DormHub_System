# ---- Stage 1: Build the React client ----
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- Stage 2: Install server production deps ----
FROM node:20-alpine AS server-deps
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev

# ---- Stage 3: Runtime image ----
FROM node:20-alpine
WORKDIR /app/server
ENV NODE_ENV=production
COPY --from=server-deps /app/server/node_modules ./node_modules
COPY server/ ./
COPY --from=client-build /app/client/build ./public
EXPOSE 5000
CMD ["node", "server.js"]
