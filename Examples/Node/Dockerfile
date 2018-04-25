FROM node:latest

# Home dir
ENV HOME=/home/app
WORKDIR $HOME/example

# Install packages
COPY package.json package-lock.json $HOME/exmaple/
RUN npm install --silent

# Copy rest of files
COPY . $HOME/example

# Use this port
EXPOSE 8000
