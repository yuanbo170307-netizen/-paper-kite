package com.appspaces.boot.app.project.controller;

import com.appspaces.boot.app.project.model.request.CreateProjectRequest;
import com.appspaces.boot.app.project.model.request.UpdateProjectRequest;
import com.appspaces.boot.app.project.model.response.ProjectResponse;
import com.appspaces.boot.app.project.service.ProjectService;
import com.appspaces.commons.controller.AbstractApiController;
import com.appspaces.commons.model.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 项目管理接口
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@RestController
@RequestMapping("/api/project")
public class AdminProjectController extends AbstractApiController {

    @Autowired
    private ProjectService projectService;

    /**
     * 创建项目
     *
     * @param request 创建请求
     * @return 项目信息
     */
    @PostMapping
    public ApiResponse<ProjectResponse> create(@Validated @RequestBody CreateProjectRequest request) {
        return setContext(projectService.create(request));
    }

    /**
     * 项目列表
     *
     * @return 项目列表
     */
    @GetMapping("/list")
    public ApiResponse<List<ProjectResponse>> list() {
        return setContext(projectService.list());
    }

    /**
     * 更新项目
     *
     * @param projectId 项目 ID
     * @param request   更新请求
     * @return 项目信息
     */
    @PutMapping("/{projectId}")
    public ApiResponse<ProjectResponse> update(@PathVariable Long projectId,
                                               @RequestBody UpdateProjectRequest request) {
        return setContext(projectService.update(projectId, request));
    }

    /**
     * 上传项目图标
     *
     * @param projectId 项目 ID
     * @param file      图标文件
     * @return 项目信息
     */
    @PostMapping("/{projectId}/icon")
    public ApiResponse<ProjectResponse> uploadIcon(@PathVariable Long projectId,
                                                   @RequestParam("file") MultipartFile file) {
        return setContext(projectService.uploadIcon(projectId, file));
    }

    /**
     * 删除项目
     *
     * @param projectId 项目 ID
     * @return 空
     */
    @DeleteMapping("/{projectId}")
    public ApiResponse<Void> delete(@PathVariable Long projectId) {
        projectService.delete(projectId);
        return setContext();
    }
}
