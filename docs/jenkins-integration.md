# Jenkins 接入 Appspaces 指南

## 接口信息

| 项目 | 值 |
|------|-----|
| 接口地址 | `POST https://your-domain.com/api/open/upload` |
| 认证方式 | Header `X-Api-Token` |
| Token | `your-api-token` |
| 文件大小限制 | 500MB |

---

## 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 安装包文件（.ipa 或 .apk） |
| projectKey | String | 是 | 项目标识（如 litchat、galachat、royachat） |
| environment | String | 否 | 环境，默认 release。可选值：dev / test / release |
| changelog | String | 否 | 更新说明 |
| versionName | String | 否 | 版本号，不填则从包自动解析 |

---

## curl 示例

```bash
curl -X POST https://your-domain.com/api/open/upload \
  -H "X-Api-Token: your-api-token" \
  -F "file=@app-release.apk" \
  -F "projectKey=litchat" \
  -F "environment=release" \
  -F "changelog=Jenkins Build #123"
```

返回示例：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "appKey": "b77ec309",
    "name": "Lit Wavee",
    "platform": 2,
    "bundleId": "com.example.app"
  }
}
```

---

## Jenkinsfile 示例（Pipeline）

### Android

```groovy
pipeline {
    agent any

    environment {
        APPSPACES_TOKEN = 'your-api-token'
        APPSPACES_URL = 'https://your-domain.com/api/open/upload'
        PROJECT_KEY = 'litchat'
    }

    stages {
        stage('Build') {
            steps {
                sh './gradlew assembleRelease'
            }
        }

        stage('Upload to Appspaces') {
            steps {
                script {
                    def apkFile = sh(script: "find app/build/outputs/apk/release -name '*.apk' | head -1", returnStdout: true).trim()
                    def response = sh(script: """
                        curl -s -X POST ${APPSPACES_URL} \\
                          -H "X-Api-Token: ${APPSPACES_TOKEN}" \\
                          -F "file=@${apkFile}" \\
                          -F "projectKey=${PROJECT_KEY}" \\
                          -F "environment=release" \\
                          -F "changelog=Jenkins Build #${BUILD_NUMBER} - ${GIT_COMMIT?.take(8)}"
                    """, returnStdout: true).trim()
                    echo "Appspaces: ${response}"
                }
            }
        }
    }
}
```

### iOS

```groovy
pipeline {
    agent { label 'mac' }

    environment {
        APPSPACES_TOKEN = 'your-api-token'
        APPSPACES_URL = 'https://your-domain.com/api/open/upload'
        PROJECT_KEY = 'litchat'
    }

    stages {
        stage('Build') {
            steps {
                sh '''
                    xcodebuild -workspace App.xcworkspace \
                      -scheme App \
                      -configuration Release \
                      -archivePath build/App.xcarchive \
                      archive

                    xcodebuild -exportArchive \
                      -archivePath build/App.xcarchive \
                      -exportPath build/ipa \
                      -exportOptionsPlist ExportOptions.plist
                '''
            }
        }

        stage('Upload to Appspaces') {
            steps {
                script {
                    def ipaFile = sh(script: "find build/ipa -name '*.ipa' | head -1", returnStdout: true).trim()
                    def response = sh(script: """
                        curl -s -X POST ${APPSPACES_URL} \\
                          -H "X-Api-Token: ${APPSPACES_TOKEN}" \\
                          -F "file=@${ipaFile}" \\
                          -F "projectKey=${PROJECT_KEY}" \\
                          -F "environment=release" \\
                          -F "changelog=Jenkins Build #${BUILD_NUMBER}"
                    """, returnStdout: true).trim()
                    echo "Appspaces: ${response}"
                }
            }
        }
    }
}
```

---

## Freestyle Job（Shell 脚本）

如果用 Freestyle Job，在构建后操作中添加 **Execute Shell**：

```bash
#!/bin/bash

APPSPACES_URL="https://your-domain.com/api/open/upload"
APPSPACES_TOKEN="your-api-token"
PROJECT_KEY="litchat"
ENVIRONMENT="release"

# 查找构建产物（按实际路径修改）
APK_FILE=$(find app/build/outputs/apk/release -name "*.apk" | head -1)
# 或 IPA：
# IPA_FILE=$(find build/ipa -name "*.ipa" | head -1)

if [ -z "$APK_FILE" ]; then
    echo "未找到安装包文件"
    exit 1
fi

RESPONSE=$(curl -s -X POST "$APPSPACES_URL" \
  -H "X-Api-Token: $APPSPACES_TOKEN" \
  -F "file=@$APK_FILE" \
  -F "projectKey=$PROJECT_KEY" \
  -F "environment=$ENVIRONMENT" \
  -F "changelog=Jenkins Build #${BUILD_NUMBER}")

echo "上传结果: $RESPONSE"

# 检查返回码
CODE=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['code'])" 2>/dev/null)
if [ "$CODE" != "200" ]; then
    echo "上传失败"
    exit 1
fi

echo "上传成功"
```

---

## 安全建议

1. **Token 不要硬编码在 Jenkinsfile 中**，建议使用 Jenkins Credentials：
   ```groovy
   environment {
       APPSPACES_TOKEN = credentials('appspaces-api-token')
   }
   ```
   在 Jenkins 管理页面添加 **Secret text** 类型的凭据，ID 设为 `appspaces-api-token`。

2. 如需更换 Token，修改服务器配置文件 `/opt/appspaces/` 下的 `application-prod.yml` 中的 `appspaces.api-token`，然后重启后端。

---

## 查看项目标识（projectKey）

登录管理后台 https://your-domain.com，在项目列表中查看各项目的 `projectKey`。

常用项目标识：

| 项目 | projectKey |
|------|------------|
| （按实际项目填写） | - |
