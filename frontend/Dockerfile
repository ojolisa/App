# Frontend (Vite build + Nginx serve)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# Install all deps (including dev) for build
RUN npm ci && npm cache clean --force
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# Add nginx config to proxy /api to backend service
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
