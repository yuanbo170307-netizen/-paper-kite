package com.appspaces.boot.app.app.model.response;

import lombok.Getter;
import lombok.Setter;

import java.util.Date;

/**
 * 应用响应
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Getter
@Setter
public class AppResponse {

    private Long id;
    private Long projectId;
    private String appKey;
    private String bundleId;
    private String name;
    private String iconUrl;
    private Integer platform;
    private Integer accessType;
    private Long currentVersionId;
    private Long downloadCount;
    private Date createTime;
    private Date updateTime;
}
