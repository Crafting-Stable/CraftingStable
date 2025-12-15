FROM node:latest

WORKDIR /app

# Build argument for PayPal Client ID
ARG VITE_PAYPAL_CLIENT_ID
ENV VITE_PAYPAL_CLIENT_ID=${VITE_PAYPAL_CLIENT_ID}

COPY package.json ./
COPY package-lock.json ./
COPY . ./

RUN npm install --frozen-lockfile

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]