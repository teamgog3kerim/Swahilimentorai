#!/bin/bash
set -e
npm install
timeout 90 npm run db:push -- --force || echo "Warning: db:push did not complete (schema may already be in sync); continuing."
