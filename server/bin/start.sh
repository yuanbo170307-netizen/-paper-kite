#!/bin/bash
# Appspaces 启动脚本
# 用法: ./start.sh [profile]  默认 test

APP_NAME="appspaces"
APP_HOME=$(cd "$(dirname "$0")/.." && pwd)
JAR_PATH="$APP_HOME/appspaces-0.0.1-SNAPSHOT.jar"
LOG_PATH="$APP_HOME/logs"
PID_FILE="$APP_HOME/appspaces.pid"
PROFILE="${1:-test}"

mkdir -p "$LOG_PATH"

if [ ! -f "$JAR_PATH" ]; then
    echo "[$APP_NAME] JAR 不存在: $JAR_PATH"
    exit 1
fi

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "[$APP_NAME] 已在运行 (PID: $PID)"
        exit 1
    fi
fi

echo "[$APP_NAME] 启动 (profile: $PROFILE)"
nohup java -Xms512m -Xmx1024m \
    -jar "$JAR_PATH" \
    --spring.profiles.active="$PROFILE" \
    > "$LOG_PATH/app.log" 2>&1 &

echo $! > "$PID_FILE"
echo "[$APP_NAME] PID: $!"
echo "[$APP_NAME] 日志: tail -f $LOG_PATH/app.log"
