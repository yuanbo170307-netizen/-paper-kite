package com.appspaces.boot.app.app.entity;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import java.util.Date;

/**
 * 应用实体
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Getter
@Setter
@Table(name = "app")
public class AppEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 所属项目 ID
     */
    private Long projectId;

    /**
     * 应用唯一标识，用于短链
     */
    private String appKey;

    /**
     * iOS bundleId / Android packageName
     */
    private String bundleId;

    /**
     * 应用名称
     */
    private String name;

    /**
     * OSS 图标路径
     */
    private String iconPath;

    /**
     * 平台：1-iOS 2-Android
     * @see com.appspaces.boot.app.app.common.enums.PlatformEnum
     */
    private Integer platform;

    /**
     * 访问类型：1-公开 2-密码保护
     * @see com.appspaces.boot.app.app.common.enums.AccessTypeEnum
     */
    private Integer accessType;

    /**
     * 访问密码
     */
    private String accessPassword;

    /**
     * 当前展示版本 ID
     */
    private Long currentVersionId;

    /**
     * 累计下载次数
     */
    private Long downloadCount;

    private Date createTime;
    private Date updateTime;
}
