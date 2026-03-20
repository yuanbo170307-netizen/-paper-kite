# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Appspaces 是一个公司内部使用的 App 内测分发平台，类似蒲公英(pgyer.com)的核心分发功能。只做分发，不做 SDK 集成、崩溃分析、性能监控等。

参考项目：[app-space](https://github.com/appspa/app-space)

## 技术栈

- **后端**: Java 8 + Spring Boot 2.3.x + Maven 多模块
- **数据库**: MySQL
- **缓存**: Redis
- **文件存储**: 阿里云 OSS（存储 IPA/APK 安装包及应用图标）
- **前端**: 独立项目，管理后台(SPA) + 下载页(轻量 H5)
- **部署**: Docker + Nginx(HTTPS 反向代理)

## 核心功能

| 模块 | 说明 |
|------|------|
| 项目管理 | 多项目隔离（如 litchat、galachat、royachat 各自独立空间） |
| App 上传 | 上传 IPA/APK，自动解析包信息(bundleId、版本号、图标等) |
| App 下载安装 | iOS 走 itms-services:// OTA 安装，Android 直接下载 APK |
| 下载页 | 自动生成下载页，含二维码、平台识别、密码保护 |
| 版本管理 | 多版本历史记录，可切换"当前版本" |
| 应用管理 | 按 bundleId/packageName 聚合，归属于具体项目 |
| 访问控制 | 公开 / 密码保护 / 链接有效期 |

## 关键设计决策

### iOS 签名：平台不签名

平台不做任何 iOS 签名/重签名操作。IPA 由开发者本地或 CI 打包时完成签名（Ad-Hoc/Enterprise），平台只负责存储和分发。流程：

```
开发者上传已签名 IPA → 平台存 OSS + 解析元信息 → 生成 manifest.plist → 用户 Safari 安装
```

### iOS OTA 安装机制

iOS 不允许直接下载安装 IPA，必须通过 `itms-services://` 协议：
1. 用户在 Safari 点击安装链接：`itms-services://?action=download-manifest&url=https://域名/api/manifest/{versionId}.plist`
2. iOS 系统请求 manifest.plist（后端动态生成，Content-Type: application/xml）
3. iOS 解析 plist 中的 IPA 下载地址，下载并安装

**硬性要求**：manifest.plist URL 和 IPA 下载 URL 都必须 HTTPS，证书须被 iOS 信任。

### 文件存储

所有安装包和图标存阿里云 OSS，按项目隔离存储路径：`appspaces/{projectKey}/{appKey}/{versionId}/`。数据库只存 OSS 路径。OSS Bucket 需开启 HTTPS 访问。

## 架构

```
Nginx (HTTPS + 反向代理)
    ├── /admin/*     → 前端项目(appspaces-web) 管理后台 SPA 静态资源
    ├── /d/*         → 前端项目(appspaces-web) 下载页静态资源
    └── /api/*       → 后端项目(appspaces) Spring Boot
                          ├── 上传解析服务 (IPA: dd-plist, APK: apk-parser)
                          ├── 项目/应用/版本管理服务
                          ├── manifest.plist 动态生成
                          ├── 下载页数据接口
                          └── 阿里云 OSS 存储服务
```

后端单体应用，不拆微服务。前端独立部署，Nginx 按路径分发。

## 项目结构

同一仓库下分 `server` 和 `web` 两个子项目，独立构建、独立部署。

```
appspaces/
├── CLAUDE.md
├── server/                      # 后端（Java 8 + Spring Boot 2.3.x，单模块）
│   ├── pom.xml
│   ├── src/main/java/com/appspaces/
│   │   ├── boot/               # 业务代码（启动类、controller/service/repository/entity/component）
│   │   ├── commons/            # 通用基类（AbstractApiController、AbstractRepository、异常、响应包装）
│   │   └── storage/            # OSS 存储服务
│   ├── src/main/resources/     # application.yml 各环境配置
│   ├── sql/init.sql
│   └── Dockerfile
└── web/                         # 前端（React 18 + TypeScript + Vite + Tailwind CSS）
    ├── package.json
    ├── src/
    │   ├── admin/               # 管理后台 SPA（项目/应用/版本管理）
    │   ├── download/            # 下载页（平台识别、安装引导）
    │   └── services/api.ts      # API 接口封装
    └── vite.config.ts
```

## 数据库设计

### project 表 - 项目

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | |
| project_key | VARCHAR(32) UNIQUE | 项目标识如 litchat、galachat、royachat |
| name | VARCHAR(128) | 项目名称 |
| description | VARCHAR(512) | 项目描述 |

### app 表 - 应用（按 bundleId 聚合，归属项目）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | |
| project_id | BIGINT | 所属项目 |
| app_key | VARCHAR(32) UNIQUE | 应用唯一标识，用于短链 |
| bundle_id | VARCHAR(256) | iOS bundleId / Android packageName |
| name | VARCHAR(128) | 应用名称 |
| icon_path | VARCHAR(512) | OSS 图标路径 |
| platform | TINYINT | 1-iOS 2-Android |
| access_type | TINYINT | 1-公开 2-密码保护 |
| access_password | VARCHAR(64) | 访问密码 |
| current_version_id | BIGINT | 当前展示版本 |
| download_count | BIGINT | 累计下载次数 |

### app_version 表 - 版本（每次上传一条）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | |
| app_id | BIGINT | 关联应用 |
| version_name | VARCHAR(64) | 版本号如 1.0.0 |
| version_code | INT | 构建号 |
| file_path | VARCHAR(512) | OSS 安装包路径 |
| file_size | BIGINT | 文件大小(字节) |
| changelog | TEXT | 更新说明 |
| min_os_version | VARCHAR(32) | 最低系统版本 |
| expire_time | DATETIME | 过期时间，null 永不过期 |
| download_count | BIGINT | 下载次数 |

## API 设计

```
# 项目接口（需登录）
POST   /api/project                    # 创建项目
GET    /api/project/list               # 项目列表
PUT    /api/project/{projectId}        # 更新项目
DELETE /api/project/{projectId}        # 删除项目

# 应用接口（需登录，项目下操作）
POST   /api/project/{projectId}/app/upload    # 上传安装包到指定项目
GET    /api/project/{projectId}/app/list      # 该项目下的应用列表
GET    /api/app/{appId}/versions              # 版本列表
PUT    /api/app/{appId}                       # 更新应用信息
PUT    /api/app/{appId}/current               # 设置当前版本
DELETE /api/app/version/{versionId}           # 删除版本

# 公开接口（下载页使用，无需登录）
GET    /api/public/{appKey}            # 获取应用+当前版本信息
POST   /api/public/{appKey}/verify     # 验证访问密码
GET    /api/download/{versionId}       # 下载安装包（302 到 OSS 地址）
GET    /api/manifest/{versionId}.plist # iOS manifest（动态生成 XML）
GET    /api/icon/{appId}               # 应用图标（302 到 OSS 地址）
GET    /api/qrcode/{appKey}            # 生成二维码图片
```

## 关键依赖

| 依赖 | 用途 |
|------|------|
| com.googlecode.plist:dd-plist | 解析 IPA 中的 Info.plist |
| net.dongliu:apk-parser | 解析 APK 的 AndroidManifest |
| com.google.zxing:core | 生成二维码 |
| com.aliyun.oss:aliyun-sdk-oss | 阿里云 OSS SDK |

## IPA 解析要点

IPA 本质是 zip 文件，解压后在 `Payload/*.app/Info.plist` 读取元信息。Info.plist 是二进制格式，需用 dd-plist 库解析。关键字段：CFBundleIdentifier(bundleId)、CFBundleShortVersionString(版本号)、CFBundleVersion(构建号)、CFBundleIcons(图标)。

## 下载页逻辑

通过 User-Agent 判断平台：
- iOS + Safari → 显示"安装"按钮（itms-services:// 链接）
- iOS + 非 Safari → 提示"请用 Safari 打开"
- Android → 显示"下载"按钮（直接下载 APK）
- PC → 显示二维码，提示手机扫码

## 编码规范

基础包名：`com.appspaces`

### 包结构

```
├── common
│   ├── enums              // 枚举（必须以 Enum 结尾）
│   ├── constants          // 常量（CacheKey、状态码、配置Key）
│   └── utils              // 纯工具类（无业务流程）
├── controller             // 接口层
├── service                // 业务逻辑层
│   ├── command            // 业务指令层
│   └── impl               // service 实现类
├── repository             // 数据访问层
├── entity                 // 数据库实体
├── model
│   ├── request            // 请求模型（Controller 入参）
│   ├── response           // 响应模型（Controller 出参）
│   └── command            // 内部命令对象（Service 内部传参）
├── component              // 业务组件（可复用业务能力）
└── schedule               // 定时任务（只调度，不写业务）
```

### 命名规则

- Controller: `XxxController` | Service 接口: `XxxService` | 实现: `XxxServiceImpl`
- Repository: `XxxRepository` | Entity: `XxxEntity` | Component: `XxxComponent`
- 枚举: `XxxEnum` | Schedule: `XxxSchedule`

### 依赖规则（强制）

- Controller → Service → Repository
- Controller → Component, Service → Component
- **严禁**：Controller 直接访问 Repository、Repository 依赖 Service、Entity 依赖 Service/Repository

### 分层职责

**Controller 层**：
- 只做：接收参数、调用 Service、返回响应、参数验证（@Validated + Bean Validation）
- 严禁：写业务逻辑、写 SQL、直接操作 Repository
- POST 接口必须用 @RequestBody 接收 JSON，禁止 @RequestParam，必须创建 Request 对象
- 使用 setContext() 设置响应数据

**Service 层**：
- 所有业务逻辑在 Service 层实现
- @Transactional 只能放在 Service 层
- 禁止跨 Service 直接操作 Repository，必须调用对应 Service 的方法
- 分页查询必须使用物理分页，禁止 RowBounds

**Schedule 层**：只负责调度，业务逻辑调用 Service

### 代码风格

**命名**：
- 类名大驼峰、方法/变量小驼峰、常量全大写下划线
- 复数用 List 结尾（idList、userIdList），禁止 ids、userIds

**空值判断**：
- 集合：`CollectionUtils.isEmpty()` / `isNotEmpty()`
- 字符串：`StringUtils.isBlank()` / `isNotBlank()`
- 对象：`Objects.isNull()` / `nonNull()`

**可读性**：
- 避免超过 2 层 if 嵌套
- 方法长度控制在 50 行以内
- 禁止魔法数字
- 不滥用 Lombok @Data，按需用 @Getter / @Setter

**注释**：
- 禁止行尾注释，注释必须单独成行放在代码上方
- 所有方法必须有 JavaDoc（@Override 例外）
- 类注释：描述 + @author liyuanbo + @create YYYY/MM/DD

**Spring 注解**：
- 使用 @Autowired 字段注入
- Controller: @RestController + @RequestMapping
- Service: @Service | Repository: @Repository

**日志**：
- SLF4J，错误日志包含类名、方法名、关键参数
- 格式：`log.error("XxxService#method 失败，param={}", param, e);`

### 参数验证

- Controller 层：@Validated + Bean Validation（@NotNull、@NotBlank 等）
- Service 层：Assert.isTrue() + StringUtils
- Command 对象：@Builder + @AllArgsConstructor，build() 中用 ValidatedUtils.validateEntity()
- /admin 接口异常提示可用中文，非 /admin 接口必须英文

### 异常处理

- 不允许吞掉异常
- 使用 Assert.isTrue() 做业务校验
- 使用 BizRuntimeException 抛业务异常
- 出错不要悄悄返回 null
- 异常信息包含足够上下文，记录日志含关键参数和堆栈

### Entity 规范

字段顺序：主键 ID → 业务字段 → 时间字段(createTime, updateTime 最后)

字段类型：
- 状态字段（0/1/2）：TINYINT
- VARCHAR 长度必须是 2 的倍数（16、32、64、128、256）

### 对象转换

- 禁止 facadeService.formatXxxVo()
- 使用 new XxxVo() + BeanUtils.copyProperties(source, target)

### 本项目特定规则

- Redis 缓存 Key 格式：`appspaces:模块:业务含义:`
- 下载计数用 Redis INCR 原子操作，异步回写 MySQL
- 不要返回数据库实体给前端，必须用 Response 对象

### 构建命令

```bash
# 后端
cd server && mvn clean package -DskipTests

# 前端
cd web && npm install && npm run dev    # 开发
cd web && npm run build                  # 生产构建
```

## 部署要求

- HTTPS 必须（iOS OTA 硬性要求），Nginx 配置正规 CA 证书
- Nginx 需配置 MIME：`.plist → application/xml`
- OSS Bucket 开启 HTTPS + 绑定自定义域名（或使用 OSS 默认 HTTPS 域名）
- spring.servlet.multipart.max-file-size=500MB
