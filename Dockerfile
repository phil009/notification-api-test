# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:20-alpine AS build
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --maxsockets=3 --fetch-retries=8 --fetch-retry-mintimeout=20000
COPY . .
RUN npm run tsc
RUN npx api-doc --input ./src/conf/router.ts --out ./openapi.json
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    --mount=type=cache,target=/root/.npm \
    npm prune --omit=dev

# ---- runtime stage ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/openapi.json ./openapi.json
COPY static/ ./static/
COPY src/swagger-ui.html ./src/swagger-ui.html

USER node
EXPOSE 5000
CMD ["node", "dist/index.js"]