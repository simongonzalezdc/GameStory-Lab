#!/bin/bash
# Restart GameStory-Lab dev services.
#
# D5 fix (card t_4d397065): this script stops ONLY dev processes that were
# started from THIS checkout. It matches candidate PIDs by command line and
# then requires the process's working directory to be inside this repo before
# killing — it never pattern-kills by name (`pkill -f "vite"` and friends kill
# unrelated processes on shared hosts).
#
# Note: the /proc-based cwd check works on Linux. On hosts without /proc
# (macOS) the loop kills nothing — run your stops manually there.

set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Safety net: if the repo root ever resolves empty (or to something that is
# not a directory), the cwd scoping below would degrade to "match everything"
# — refuse to run rather than risk killing unrelated processes.
if [ -z "$REPO_ROOT" ] || [ ! -d "$REPO_ROOT" ]; then
  echo "ERROR: could not resolve the repository root — refusing to stop anything." >&2
  exit 1
fi

echo "🛑 Stopping dev processes started from this checkout (${REPO_ROOT})..."

for pid in $(pgrep -f 'vite|tsx watch|concurrently' 2>/dev/null); do
  # Never kill ourselves or our process group.
  [ "$pid" = "$$" ] && continue
  [ "$pid" = "$PPID" ] && continue

  cwd="$(readlink "/proc/${pid}/cwd" 2>/dev/null || true)"
  if [ -z "$cwd" ]; then
    echo "  skipping PID $pid (no /proc cwd visible — cannot scope safely)"
    continue
  fi

  case "$cwd" in
    "$REPO_ROOT"*)
      echo "  stopping PID $pid (cwd: $cwd)"
      kill "$pid" 2>/dev/null || true
      ;;
    *)
      echo "  leaving PID $pid alone (cwd outside this repo: $cwd)"
      ;;
  esac
done

sleep 1

echo "🐳 Restarting Docker services..."
docker-compose restart

echo "⏳ Waiting for services to be ready..."
sleep 3

echo "🚀 Starting all dev servers..."
npm run dev
