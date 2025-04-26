# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the Vite app
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built assets from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server

# Expose port 10000 instead of the default 3000
ENV PORT=10000
EXPOSE 10000

# Start the server
CMD ["node", "server/index.js"] 