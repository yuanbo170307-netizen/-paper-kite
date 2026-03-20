#!/bin/bash
# Appspaces MySQL 初始化脚本
# 在服务器上执行: bash server-init.sh

set -e

MYSQL_DATA_DIR="/data/mysql"
DB_NAME="appspaces"
DB_USER="appspaces"
DB_PWD="Appspaces@2026"

echo "========================================="
echo "  Appspaces MySQL 初始化"
echo "========================================="

# 检测系统
if [ -f /etc/redhat-release ]; then
    OS="centos"
elif [ -f /etc/lsb-release ]; then
    OS="ubuntu"
else
    echo "不支持的系统"; exit 1
fi

# 1. 安装 MySQL
echo ""
echo "[1/3] 安装 MySQL..."
if command -v mysql &>/dev/null; then
    echo "      MySQL 已安装，跳过"
else
    if [ "$OS" = "centos" ]; then
        yum install -y mysql-server
    else
        apt-get update -qq && apt-get install -y -qq mysql-server
    fi
    echo "      安装完成"
fi

# 2. 修改数据目录
echo ""
echo "[2/3] 配置数据目录: $MYSQL_DATA_DIR ..."
mkdir -p "$MYSQL_DATA_DIR"

# 停止 MySQL
systemctl stop mysqld 2>/dev/null || systemctl stop mysql 2>/dev/null || true

# 如果数据目录是空的，迁移默认数据
DEFAULT_DATA="/var/lib/mysql"
if [ -d "$DEFAULT_DATA/mysql" ] && [ ! -d "$MYSQL_DATA_DIR/mysql" ]; then
    echo "      迁移数据文件到 $MYSQL_DATA_DIR ..."
    cp -a "$DEFAULT_DATA"/* "$MYSQL_DATA_DIR/"
fi

chown -R mysql:mysql "$MYSQL_DATA_DIR"

# 写入配置
if [ "$OS" = "centos" ]; then
    MYSQL_CONF="/etc/my.cnf"
else
    MYSQL_CONF="/etc/mysql/mysql.conf.d/mysqld.cnf"
fi

# 备份原配置
cp "$MYSQL_CONF" "${MYSQL_CONF}.bak" 2>/dev/null || true

# 替换 datadir
if grep -q "^datadir" "$MYSQL_CONF"; then
    sed -i "s|^datadir.*|datadir=$MYSQL_DATA_DIR|" "$MYSQL_CONF"
else
    echo "[mysqld]" >> "$MYSQL_CONF"
    echo "datadir=$MYSQL_DATA_DIR" >> "$MYSQL_CONF"
fi

# 启动 MySQL
systemctl start mysqld 2>/dev/null || systemctl start mysql 2>/dev/null
systemctl enable mysqld 2>/dev/null || systemctl enable mysql 2>/dev/null
echo "      数据目录: $MYSQL_DATA_DIR"

# 3. 初始化数据库
echo ""
echo "[3/3] 初始化数据库..."
echo "      请输入 MySQL root 密码（新装的直接回车）:"
read -s MYSQL_ROOT_PWD

MYSQL_CMD="mysql -u root"
[ -n "$MYSQL_ROOT_PWD" ] && MYSQL_CMD="mysql -u root -p$MYSQL_ROOT_PWD"

$MYSQL_CMD <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PWD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

$MYSQL_CMD $DB_NAME <<'SQL'
CREATE TABLE IF NOT EXISTS `project` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT,
    `project_key`   VARCHAR(32)  NOT NULL,
    `name`          VARCHAR(128) NOT NULL,
    `description`   VARCHAR(512) DEFAULT NULL,
    `icon_path`     VARCHAR(512) DEFAULT NULL,
    `create_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_project_key` (`project_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `app` (
    `id`                 BIGINT       NOT NULL AUTO_INCREMENT,
    `project_id`         BIGINT       NOT NULL,
    `app_key`            VARCHAR(32)  NOT NULL,
    `bundle_id`          VARCHAR(256) NOT NULL,
    `name`               VARCHAR(128) NOT NULL,
    `icon_path`          VARCHAR(512) DEFAULT NULL,
    `platform`           TINYINT      NOT NULL,
    `access_type`        TINYINT      NOT NULL DEFAULT 1,
    `access_password`    VARCHAR(64)  DEFAULT NULL,
    `current_version_id` BIGINT       DEFAULT NULL,
    `download_count`     BIGINT       NOT NULL DEFAULT 0,
    `create_time`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_app_key` (`app_key`),
    KEY `idx_project_id` (`project_id`),
    KEY `idx_bundle_id` (`bundle_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `app_version` (
    `id`             BIGINT       NOT NULL AUTO_INCREMENT,
    `app_id`         BIGINT       NOT NULL,
    `version_name`   VARCHAR(64)  NOT NULL,
    `version_code`   INT          NOT NULL DEFAULT 0,
    `file_path`      VARCHAR(512) NOT NULL,
    `file_size`      BIGINT       NOT NULL DEFAULT 0,
    `changelog`      TEXT         DEFAULT NULL,
    `environment`    VARCHAR(16)  NOT NULL DEFAULT 'test',
    `min_os_version` VARCHAR(32)  DEFAULT NULL,
    `expire_time`    DATETIME     DEFAULT NULL,
    `download_count` BIGINT       NOT NULL DEFAULT 0,
    `create_time`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_app_id` (`app_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL

echo ""
echo "========================================="
echo "  初始化完成"
echo "========================================="
echo ""
echo "  MySQL 数据目录: $MYSQL_DATA_DIR"
echo "  数据库: $DB_NAME"
echo "  用户名: $DB_USER"
echo "  密码:   $DB_PWD"
echo ""
