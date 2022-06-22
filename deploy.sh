#!/bin/bash

echo "Deploying Server"

# Restart Server
pm2 restart pm2.config.js

# If previously not started, start fresh
pm2 start pm2.config.js
echo "S E R V E R   D E P L O Y E D"