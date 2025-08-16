# Backend (Express) Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy source
COPY . .

ENV NODE_ENV=production \
    PORT=4000 \
    FLASK_URL=http://inference:3000

EXPOSE 4000

CMD ["npm", "start"]
