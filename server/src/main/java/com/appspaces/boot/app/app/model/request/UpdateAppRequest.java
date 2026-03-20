package com.appspaces.boot.app.app.model.request;

import lombok.Getter;
import lombok.Setter;

/**
 * 更新应用请求
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Getter
@Setter
public class UpdateAppRequest {

    /**
     * 应用名称
     */
    private String name;

    /**
     * 访问类型：1-公开 2-密码保护
     */
    private Integer accessType;

    /**
     * 访问密码
     */
    private String accessPassword;
}
