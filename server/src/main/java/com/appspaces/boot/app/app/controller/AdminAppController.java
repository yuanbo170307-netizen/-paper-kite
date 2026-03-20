package com.appspaces.boot.app.app.controller;

import com.appspaces.boot.app.app.model.request.SetCurrentVersionRequest;
import com.appspaces.boot.app.app.model.request.UpdateAppRequest;
import com.appspaces.boot.app.app.model.response.AppResponse;
import com.appspaces.boot.app.app.service.AppService;
import com.appspaces.boot.app.version.model.response.AppVersionResponse;
import com.appspaces.boot.app.version.service.AppVersionService;
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
 * 应用管理接口
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@RestController
@RequestMapping("/api")
public class AdminAppController extends AbstractApiController {

    @Autowired
    private AppService appService;

    @Autowired
    private AppVersionService appVersionService;

    /**
     * 上传安装包
     *
     * @param file        安装包文件
     * @param versionName 版本号（可选，不填则从包解析）
     * @param environment 环境：dev/test/release
     * @param changelog   更新说明
     * @return 应用信息
     */
    @PostMapping("/app/upload")
    public ApiResponse<AppResponse> upload(@RequestParam("file") MultipartFile file,
                                           @RequestParam(value = "versionName", required = false) String versionName,
                                           @RequestParam(value = "environment", defaultValue = "test") String environment,
                                           @RequestParam(value = "changelog", required = false) String changelog) {
        return setContext(appService.upload(file, versionName, environment, changelog));
    }

    /**
     * 全部应用列表
     *
     * @return 应用列表
     */
    @GetMapping("/app/list")
    public ApiResponse<List<AppResponse>> list() {
        return setContext(appService.listAll());
    }

    /**
     * 获取应用详情
     *
     * @param appId 应用 ID
     * @return 应用信息
     */
    @GetMapping("/app/{appId}")
    public ApiResponse<AppResponse> get(@PathVariable Long appId) {
        return setContext(appService.getDetail(appId));
    }

    /**
     * 版本列表
     *
     * @param appId 应用 ID
     * @return 版本列表
     */
    @GetMapping("/app/{appId}/versions")
    public ApiResponse<List<AppVersionResponse>> versions(@PathVariable Long appId) {
        return setContext(appVersionService.listByApp(appId));
    }

    /**
     * 更新应用信息
     *
     * @param appId   应用 ID
     * @param request 更新请求
     * @return 应用信息
     */
    @PutMapping("/app/{appId}")
    public ApiResponse<AppResponse> update(@PathVariable Long appId,
                                           @RequestBody UpdateAppRequest request) {
        return setContext(appService.update(appId, request));
    }

    /**
     * 上传应用图标
     *
     * @param appId 应用 ID
     * @param file  图标文件
     * @return 应用信息
     */
    @PostMapping("/app/{appId}/icon")
    public ApiResponse<AppResponse> uploadIcon(@PathVariable Long appId,
                                               @RequestParam("file") MultipartFile file) {
        return setContext(appService.uploadIcon(appId, file));
    }

    /**
     * 设置当前版本
     *
     * @param appId   应用 ID
     * @param request 设置当前版本请求
     * @return 空
     */
    @PutMapping("/app/{appId}/current")
    public ApiResponse<Void> setCurrentVersion(@PathVariable Long appId,
                                               @Validated @RequestBody SetCurrentVersionRequest request) {
        appService.setCurrentVersion(appId, request.getVersionId());
        return setContext();
    }

    /**
     * 删除版本
     *
     * @param versionId 版本 ID
     * @return 空
     */
    @DeleteMapping("/app/version/{versionId}")
    public ApiResponse<Void> deleteVersion(@PathVariable Long versionId) {
        appVersionService.delete(versionId);
        return setContext();
    }
}
