# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install --include=dev

# Copy app source
COPY . .

# Expose port 3000
EXPOSE 3000

# Command to run the app
CMD [ "npm", "run", "dev" ]