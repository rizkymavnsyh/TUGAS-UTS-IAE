FROM node:11-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --include=dev
COPY . .
EXPOSE 3000
CMD [ "npm", "run", "dev" ]