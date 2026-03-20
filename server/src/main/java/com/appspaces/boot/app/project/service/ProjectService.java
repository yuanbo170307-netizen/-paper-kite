package com.appspaces.boot.app.project.service;

import com.appspaces.boot.app.project.entity.ProjectEntity;
import com.appspaces.boot.app.project.model.request.CreateProjectRequest;
import com.appspaces.boot.app.project.model.request.UpdateProjectRequest;
import com.appspaces.boot.app.project.model.response.ProjectResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 项目服务接口
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
public interface ProjectService {

    /**
     * 创建项目
     *
     * @param request 创建请求
     * @return 项目响应
     */
    ProjectResponse create(CreateProjectRequest request);

    /**
     * 项目列表
     *
     * @return 项目列表
     */
    List<ProjectResponse> list();

    /**
     * 更新项目
     *
     * @param projectId 项目 ID
     * @param request   更新请求
     * @return 项目响应
     */
    ProjectResponse update(Long projectId, UpdateProjectRequest request);

    /**
     * 上传项目图标
     *
     * @param projectId 项目 ID
     * @param file      图标文件
     * @return 项目响应
     */
    ProjectResponse uploadIcon(Long projectId, MultipartFile file);

    /**
     * 删除项目
     *
     * @param projectId 项目 ID
     */
    void delete(Long projectId);

    /**
     * 根据 ID 获取项目实体
     *
     * @param projectId 项目 ID
     * @return 项目实体
     */
    ProjectEntity getById(Long projectId);

    /**
     * 根据 projectKey 获取项目实体
     *
     * @param projectKey 项目标识
     * @return 项目实体
     */
    ProjectEntity getByProjectKey(String projectKey);
}
