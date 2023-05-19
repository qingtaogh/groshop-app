#!/bin/bash
#Stopping existing node servers
echo "Stopping any existing node servers at 8080"
kill $(lsof -t -i:8080)