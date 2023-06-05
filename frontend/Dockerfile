FROM node:18.15.0

ARG VITE_SERVERADDR

WORKDIR /usr/src/app

COPY . .

RUN yarn
RUN npx vite build

CMD npx vite preview --port 8081 --host
