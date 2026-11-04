# Stage 1: Build the production static React/Vite app
FROM node:22-alpine AS builder

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

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine

LABEL org.opencontainers.image.source="https://github.com/Petya122/branchlab" \
      org.opencontainers.image.description="BranchLab - GitFlow & CI/CD pipeline simulator"

# Nginx config + shared security headers snippet
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf

# Built artifacts
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Lets `docker compose up --wait` and the deploy pipeline know when the app is really up
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
