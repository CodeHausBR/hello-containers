# syntax=docker/dockerfile:1

FROM node:18-alpine AS build

# Set destination for COPY
WORKDIR /app

# Copy package files
COPY container_src/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy all source code
COPY container_src/ ./

# Create public directory if it doesn't exist
RUN mkdir -p public

# Expose the port the app runs on
EXPOSE 8080

# Set NODE_ENV to production
ENV NODE_ENV=production

# Run the application
CMD ["node", "index.js"]