# Stage 1: Build React application
FROM node:20-alpine AS build

WORKDIR /app

# Copy source files (supports both repo root and /frontend root contexts)
COPY . /tmp/src/
RUN if [ -d "/tmp/src/frontend" ]; then \
        cp -r /tmp/src/frontend/* /app/; \
    else \
        cp -r /tmp/src/* /app/; \
    fi && rm -rf /tmp/src

# Install dependencies
RUN npm ci

# Pass VITE_API_URL if injected at build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve with lightweight web server
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx config template to handle React Router SPA fallback and Railway dynamic PORT
RUN mkdir -p /etc/nginx/templates && echo 'server { \
    listen ${PORT}; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/templates/default.conf.template

ENV PORT=80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
