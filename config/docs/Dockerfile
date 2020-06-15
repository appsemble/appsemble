FROM node:14-slim as build
ARG CI_COMMIT_REF_NAME=dev
ENV CI_COMMIT_REF_NAME $CI_COMMIT_REF_NAME
WORKDIR /build
COPY . .
RUN yarn --frozen-lockfile \
 && yarn install-chrome-dependencies \
 && yarn docz build

FROM nginx:1.15-alpine
COPY --from=build /build/.docz/dist /usr/share/nginx/html
COPY config/docs/nginx.conf /etc/nginx/conf.d/default.conf
