package com.appspaces.boot.app.version.entity;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import java.util.Date;

/**
 * 应用版本实体
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Getter
@Setter
@Table(name = "app_version")
public class AppVersionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 关联应用 ID
     */
    private Long appId;

    /**
     * 版本号，如 1.0.0
     */
    private String versionName;

    /**
     * 构建号
     */
    private Integer versionCode;

    /**
     * OSS 安装包路径
     */
    private String filePath;

    /**
     * 文件大小（字节）
     */
    private Long fileSize;

    /**
     * 更新说明
     */
    private String changelog;

    /**
     * 环境：dev/test/release
     */
    private String environment;

    /**
     * 最低系统版本
     */
    private String minOsVersion;

    /**
     * 过期时间，null 为永不过期
     */
    private Date expireTime;

    /**
     * 下载次数
     */
    private Long downloadCount;

    private Date createTime;
    private Date updateTime;
}
