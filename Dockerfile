# Base image for Node.js
FROM node:18.16.0 AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy application source code
COPY . .

# Build the application
RUN npm run build

# Use a smaller image for production
FROM node:18.16.0

# Set working directory
WORKDIR /usr/src/app

# Copy built application and dependencies
COPY --from=builder /usr/src/app .

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
