FROM node:10.15.0-alpine

MAINTAINER josenspire@gomail.com

# Create app directory
RUN mkdir -p /superIM
WORKDIR /superIM/

# Install app dependencies
COPY . /superIM/

RUN rm -rf .idea \
    ; rm -rf .vscode \
    ; npm config set registry "https://registry.npm.taobao.org/" \
    && npm install

# CMD ["/bin/bash"];
CMD npm run prod
