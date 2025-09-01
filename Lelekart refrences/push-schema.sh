#!/bin/bash
echo "Pushing schema changes..."
echo "Yes" | npm run db:push
echo "Schema changes applied!"