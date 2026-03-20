package com.appspaces.boot.app.version.model.response;

import lombok.Getter;
import lombok.Setter;

import java.util.Date;

/**
 * 应用版本响应
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Getter
@Setter
public class AppVersionResponse {

    private Long id;
    private Long appId;
    private String versionName;
    private Integer versionCode;
    private Long fileSize;
    private String changelog;
    private String environment;
    private String minOsVersion;
    private String downloadUrl;
    private Date expireTime;
    private Long downloadCount;
    private Date createTime;
}
