FROM node

COPY . /app
WORKDIR /app

RUN npm install
EXPOSE 5173

ENV NOTESREVIEW_API_URL=https://notesreview.kongruent.xyz/api
ENV OPENSTREETMAP_SERVER=https://www.openstreetmap.org

CMD ["npm", "run", "dev", "--", "--host"]
