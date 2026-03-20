package com.appspaces.boot.app.project.model.request;

import lombok.Getter;
import lombok.Setter;

/**
 * 更新项目请求
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Getter
@Setter
public class UpdateProjectRequest {

    /**
     * 项目名称
     */
    private String name;

    /**
     * 项目描述
     */
    private String description;
}
