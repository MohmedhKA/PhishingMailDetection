#!/bin/bash

# Generate a self-signed certificate for HTTPS
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365 \
  -subj "/C=IN/ST=TAMILNADU/L=ERODE/O=SELFHOST/CN=localhost"

echo "Certificate generated successfully!"
echo "Place cert.pem and key.pem in the same directory as your server.py file"