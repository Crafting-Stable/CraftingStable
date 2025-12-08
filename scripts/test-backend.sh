#!/usr/bin/env bash
set -euo pipefail
# Helper to run backend tests locally using JWT secret from .env.local or env
# Usage: ./scripts/test-backend.sh

# Load .env.local if present
if [ -f .env.local ]; then
  # shellcheck disable=SC1091
  set -a
  source .env.local
  set +a
fi

if [ -z "${JWT_SECRET:-}" ]; then
  echo "JWT_SECRET is not set. Provide it via .env.local or environment variable."
  echo "Example: export JWT_SECRET=your_base64_secret && ./scripts/test-backend.sh"
  exit 1
fi

echo "Running backend tests with provided JWT_SECRET..."
mvn -f backend/pom.xml -Djwt.secret="$JWT_SECRET" test
