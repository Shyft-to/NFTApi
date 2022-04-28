#!/bin/bash

echo "Deploying Server"

# Restart Server
pm2 stop all
pm2 start pm2.config.js
echo "S E R V E R   D E P L O Y E D"