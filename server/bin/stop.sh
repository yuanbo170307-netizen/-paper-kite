#!/bin/bash
APP_NAME="appspaces"
APP_HOME=$(cd "$(dirname "$0")/.." && pwd)
PID_FILE="$APP_HOME/appspaces.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "[$APP_NAME] 未在运行"
    exit 0
fi

PID=$(cat "$PID_FILE")
if kill -0 "$PID" 2>/dev/null; then
    echo "[$APP_NAME] 停止 (PID: $PID)"
    kill "$PID"
    sleep 3
    kill -0 "$PID" 2>/dev/null && kill -9 "$PID"
    echo "[$APP_NAME] 已停止"
else
    echo "[$APP_NAME] 进程不存在"
fi
rm -f "$PID_FILE"
