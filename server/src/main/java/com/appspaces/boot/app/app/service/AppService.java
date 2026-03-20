package com.appspaces.boot.app.app.service;

import com.appspaces.boot.app.app.entity.AppEntity;
import com.appspaces.boot.app.app.model.request.UpdateAppRequest;
import com.appspaces.boot.app.app.model.response.AppResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 应用服务接口
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
public interface AppService {

    /**
     * 上传安装包（自动解析并创建/更新应用和版本）
     *
     * @param file        安装包文件（IPA/APK）
     * @param versionName 版本号（可选，不填则从包解析）
     * @param environment 环境：dev/test/release
     * @param changelog   更新说明
     * @return 应用响应
     */
    AppResponse upload(MultipartFile file, String versionName, String environment, String changelog);

    /**
     * 全部应用列表
     *
     * @return 应用列表
     */
    List<AppResponse> listAll();

    /**
     * 更新应用信息
     *
     * @param appId   应用 ID
     * @param request 更新请求
     * @return 应用响应
     */
    AppResponse update(Long appId, UpdateAppRequest request);

    /**
     * 设置当前版本
     *
     * @param appId     应用 ID
     * @param versionId 版本 ID
     */
    void setCurrentVersion(Long appId, Long versionId);

    /**
     * 上传应用图标
     *
     * @param appId 应用 ID
     * @param file  图标文件
     * @return 应用响应
     */
    AppResponse uploadIcon(Long appId, MultipartFile file);

    /**
     * 根据 ID 获取应用实体
     *
     * @param appId 应用 ID
     * @return 应用实体
     */
    /**
     * 获取应用详情（响应对象）
     *
     * @param appId 应用 ID
     * @return 应用响应
     */
    AppResponse getDetail(Long appId);

    AppEntity getById(Long appId);

    /**
     * 根据 appKey 获取应用实体
     *
     * @param appKey 应用标识
     * @return 应用实体
     */
    AppEntity getByAppKey(String appKey);
}
