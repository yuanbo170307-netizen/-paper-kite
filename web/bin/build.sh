#!/bin/bash
# Appspaces Web 构建脚本
# 构建产物在 dist/ 目录，用 Nginx 指向即可

APP_HOME=$(cd "$(dirname "$0")/.." && pwd)
cd "$APP_HOME"

echo "[web] 安装依赖..."
npm install --silent

echo "[web] 构建中..."
npm run build

echo "[web] 构建完成，产物: $APP_HOME/dist/"
echo "[web] Nginx 配置示例:"
cat << 'EOF'

server {
    listen 443 ssl;
    server_name appspaces.your-domain.com;

    ssl_certificate     /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # 前端静态资源
    location / {
        root /path/to/appspaces/web/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:40201;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 500m;
    }

    # plist MIME 类型（iOS OTA 必须）
    types {
        application/xml plist;
    }
}

EOF
