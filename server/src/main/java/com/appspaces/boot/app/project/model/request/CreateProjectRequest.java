package com.appspaces.boot.app.project.model.request;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;

/**
 * 创建项目请求
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Getter
@Setter
public class CreateProjectRequest {

    /**
     * 项目标识
     */
    @NotBlank(message = "项目标识不能为空")
    private String projectKey;

    /**
     * 项目名称
     */
    @NotBlank(message = "项目名称不能为空")
    private String name;

    /**
     * 项目描述
     */
    private String description;
}
