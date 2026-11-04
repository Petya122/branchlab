# Stage 1: Build the production static React/Vite app
FROM node:26.13.0-alpine3.24 AS builder

WORKDIR /app

# Install dependencies first so this layer is cached between builds
COPY package*.json ./
RUN npm ci

# Copy source and compile production bundle
COPY . .
RUN npm run build

# Build metadata, exposed at /version.json so deploys can verify what is live
ARG GIT_SHA=dev
ARG APP_VERSION=0.0.0-dev
RUN printf '{"version":"%s","commit":"%s"}\n' "$APP_VERSION" "$GIT_SHA" > dist/version.json

# Stage 2: Serve with Nginx as a non-root user (uid 101, listens on 8080)
FROM nginxinc/nginx-unprivileged:1.31.7-alpine3.24

LABEL org.opencontainers.image.source="https://github.com/Petya122/branchlab" \
      org.opencontainers.image.description="BranchLab - GitFlow & CI/CD pipeline simulator"

# Pull in Alpine security fixes that are newer than the base image
# (the Trivy gate in CI fails on fixable HIGH/CRITICAL vulnerabilities)
USER root
RUN apk upgrade --no-cache

# Nginx config + shared security headers snippet
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf

# Built artifacts
COPY --from=builder /app/dist /usr/share/nginx/html

# Drop back to the unprivileged nginx user for runtime
USER nginx

EXPOSE 8080

# Lets `docker compose up --wait` and the deploy pipeline know when the app is really up
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
