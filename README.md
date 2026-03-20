# Paper Kite / 纸鸢

App 内测分发平台，支持 iOS / Android 安装包的上传、解析、版本管理和 OTA 安装。类似蒲公英 (pgyer.com) 的核心分发功能，专注分发，轻量易部署。

## Features

- **IPA / APK 上传解析** — 自动提取 bundleId、版本号、图标等元信息
- **iOS OTA 安装** — 自动生成 manifest.plist，支持 itms-services:// 协议一键安装
- **Android 直装** — APK 直接下载安装
- **版本管理** — 多版本历史记录，可切换当前版本
- **下载页** — 自动生成下载页，含二维码、平台识别
- **访问控制** — 公开 / 密码保护
- **CI/CD 集成** — 提供 Open API，支持 Jenkins / Fastlane 等自动上传
- **阿里云 OSS 存储** — 安装包和图标存储在 OSS

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Java 8 + Spring Boot 2.3 + MyBatis |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Database | MySQL 8.0 |
| Storage | Alibaba Cloud OSS |
| Deployment | Docker / Nginx + HTTPS |

## Project Structure

```
paper-kite/
├── server/                     # Backend (Java + Spring Boot)
│   ├── pom.xml
│   ├── sql/init.sql            # Database schema
│   ├── bin/                    # start/stop/restart scripts
│   └── src/main/java/com/appspaces/
│       ├── boot/               # Business code
│       ├── commons/            # Base classes
│       └── storage/            # OSS storage service
└── web/                        # Frontend (React + TypeScript + Vite)
    ├── package.json
    └── src/
        ├── admin/              # Admin SPA
        ├── download/           # Download page (H5)
        └── services/api.ts     # API client
```

## Quick Start

### Prerequisites

- Java 8+
- Maven 3.6+
- Node.js 18+
- MySQL 8.0
- Alibaba Cloud OSS bucket

### 1. Database

```bash
mysql -u root -p < server/sql/init.sql
```

### 2. Backend

```bash
# Copy and edit config
cp server/src/main/resources/application-example.yml \
   server/src/main/resources/application-dev.yml
# Edit application-dev.yml with your DB, OSS, and JWT settings

cd server
mvn clean package -DskipTests
java -jar target/appspaces-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev
```

Backend runs at `http://localhost:40201`

### 3. Frontend

```bash
cd web
npm install
npm run dev
```

Frontend dev server runs at `http://localhost:5173`, proxying API to backend.

### 4. Production Build

```bash
cd web && npm run build    # Output: web/dist/
```

Configure Nginx to serve `web/dist/` and reverse proxy `/api/` to the backend.

## Nginx Config (Production)

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    # Frontend
    location / {
        root /opt/paper-kite/web/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:40201/api/;
        client_max_body_size 500m;
    }

    # iOS plist must return application/xml
    location ~* \.plist$ {
        proxy_pass http://127.0.0.1:40201;
        add_header Content-Type application/xml;
    }
}
```

> **HTTPS is required** for iOS OTA installation (itms-services:// protocol).

## Open API (CI/CD)

```bash
curl -X POST https://your-domain.com/api/open/upload \
  -H "X-Api-Token: your-api-token" \
  -F "file=@app-release.apk" \
  -F "environment=release" \
  -F "changelog=Build #123"
```

## License

[Apache License 2.0](LICENSE)
