package com.appspaces.boot.app.project.model.response;

import lombok.Getter;
import lombok.Setter;

import java.util.Date;

/**
 * 项目响应
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Getter
@Setter
public class ProjectResponse {

    private Long id;
    private String projectKey;
    private String name;
    private String description;
    private String iconUrl;
    private Date createTime;
    private Date updateTime;
}
