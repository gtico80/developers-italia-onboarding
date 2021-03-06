FROM node:8-alpine

WORKDIR /usr/src/app/

COPY package.json . 
RUN npm install

# copy app source to destination container
COPY . .

# inject env vars
RUN sed -i -e "s|^const ES_URL.*|const ES_URL = 'https://elasticsearch.developers.italia.it/indicepa/_search';|g"  public/assets/js/constants.js

# Launch application
CMD npm run $env
