package com.appspaces.boot.app.project.entity;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import java.util.Date;

/**
 * 项目实体
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Getter
@Setter
@Table(name = "project")
public class ProjectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 项目标识，如 litchat、galachat、royachat
     */
    private String projectKey;

    /**
     * 项目名称
     */
    private String name;

    /**
     * 项目描述
     */
    private String description;

    /**
     * OSS 图标路径
     */
    private String iconPath;

    private Date createTime;
    private Date updateTime;
}
