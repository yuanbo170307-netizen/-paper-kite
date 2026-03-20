CREATE DATABASE IF NOT EXISTS `appspaces` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `appspaces`;

-- 项目表
CREATE TABLE `project` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT,
    `project_key`   VARCHAR(32)  NOT NULL COMMENT '项目标识，如 litchat、galachat',
    `name`          VARCHAR(128) NOT NULL COMMENT '项目名称',
    `description`   VARCHAR(512) DEFAULT NULL COMMENT '项目描述',
    `icon_path`     VARCHAR(512) DEFAULT NULL COMMENT 'OSS 图标路径',
    `create_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_project_key` (`project_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目表';

-- 应用表
CREATE TABLE `app` (
    `id`                 BIGINT       NOT NULL AUTO_INCREMENT,
    `project_id`         BIGINT       NOT NULL COMMENT '所属项目 ID',
    `app_key`            VARCHAR(32)  NOT NULL COMMENT '应用唯一标识，用于短链',
    `bundle_id`          VARCHAR(256) NOT NULL COMMENT 'iOS bundleId / Android packageName',
    `name`               VARCHAR(128) NOT NULL COMMENT '应用名称',
    `icon_path`          VARCHAR(512) DEFAULT NULL COMMENT 'OSS 图标路径',
    `platform`           TINYINT      NOT NULL COMMENT '1-iOS 2-Android',
    `access_type`        TINYINT      NOT NULL DEFAULT 1 COMMENT '1-公开 2-密码保护',
    `access_password`    VARCHAR(64)  DEFAULT NULL COMMENT '访问密码',
    `current_version_id` BIGINT       DEFAULT NULL COMMENT '当前展示版本 ID',
    `download_count`     BIGINT       NOT NULL DEFAULT 0 COMMENT '累计下载次数',
    `create_time`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_app_key` (`app_key`),
    KEY `idx_project_id` (`project_id`),
    KEY `idx_bundle_id` (`bundle_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='应用表';

-- 应用版本表
CREATE TABLE `app_version` (
    `id`             BIGINT       NOT NULL AUTO_INCREMENT,
    `app_id`         BIGINT       NOT NULL COMMENT '关联应用 ID',
    `version_name`   VARCHAR(64)  NOT NULL COMMENT '版本号，如 1.0.0',
    `version_code`   INT          NOT NULL DEFAULT 0 COMMENT '构建号',
    `file_path`      VARCHAR(512) NOT NULL COMMENT 'OSS 安装包路径',
    `file_size`      BIGINT       NOT NULL DEFAULT 0 COMMENT '文件大小（字节）',
    `changelog`      TEXT         DEFAULT NULL COMMENT '更新说明',
    `environment`    VARCHAR(16)  NOT NULL DEFAULT 'test' COMMENT '环境：dev/test/release',
    `min_os_version` VARCHAR(32)  DEFAULT NULL COMMENT '最低系统版本',
    `expire_time`    DATETIME     DEFAULT NULL COMMENT '过期时间，null 为永不过期',
    `download_count` BIGINT       NOT NULL DEFAULT 0 COMMENT '下载次数',
    `create_time`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_app_id` (`app_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='应用版本表';
