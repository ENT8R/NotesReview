FROM node:19

COPY . /app
WORKDIR /app

RUN apt-get -y update && \
    apt-get -y upgrade && \
    npm install

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

