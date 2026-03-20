package com.appspaces.boot.app.app.model.response;

import com.appspaces.boot.app.version.model.response.AppVersionResponse;
import lombok.Getter;
import lombok.Setter;

/**
 * 公开下载页应用响应
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Getter
@Setter
public class PublicAppResponse {

    private String appKey;
    private String name;
    private String iconUrl;
    private Integer platform;
    private Integer accessType;

    /**
     * 当前版本信息
     */
    private AppVersionResponse currentVersion;
}
