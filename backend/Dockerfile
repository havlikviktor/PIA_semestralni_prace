# Použij Node.js image
FROM node:20-alpine

# Nastav pracovní adresář
WORKDIR /usr/src/app

# Zkopíruj package.json a package-lock.json a nainstaluj závislosti
COPY package*.json ./
RUN npm install

# Zkopíruj celý projekt
COPY . .

# Otevři port 3000
EXPOSE 3000

# Spusť backend v dev režimu (hot reload)
CMD ["npm", "run", "start:dev"]