FROM node:latest

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY . ./

RUN npm install --frozen-lockfile

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]