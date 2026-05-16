#!/bin/bash
set -e
npm install
# drizzle-kit push reads from stdin for interactive prompts; in post-merge stdin
# is closed (/dev/null), which causes it to exit 1 even with --force. We also
# guard against indefinite hangs with a 90s timeout. Schema changes should be
# applied manually with `npm run db:push` from a real terminal when needed.
set +e
timeout 90 npm run db:push -- --force
status=$?
set -e
if [ $status -eq 0 ]; then
  echo "db:push completed successfully."
else
  echo "Warning: db:push exited with code $status in non-interactive mode; continuing. Run 'npm run db:push' manually if schema changes are pending."
fi
