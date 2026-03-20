package com.appspaces.boot.app.version.service;

import com.appspaces.boot.app.version.entity.AppVersionEntity;
import com.appspaces.boot.app.version.model.response.AppVersionResponse;

import java.util.List;

/**
 * 应用版本服务接口
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
public interface AppVersionService {

    /**
     * 获取应用的版本列表
     *
     * @param appId 应用 ID
     * @return 版本列表
     */
    List<AppVersionResponse> listByApp(Long appId);

    /**
     * 根据 ID 获取版本实体
     *
     * @param versionId 版本 ID
     * @return 版本实体
     */
    AppVersionEntity getById(Long versionId);

    /**
     * 删除版本
     *
     * @param versionId 版本 ID
     */
    void delete(Long versionId);

    /**
     * 分页获取应用的版本列表
     *
     * @param appId 应用 ID
     * @param page  页码（从 1 开始）
     * @param size  每页数量
     * @return 版本列表
     */
    List<AppVersionResponse> listByAppPaged(Long appId, int page, int size);

    /**
     * 增加下载次数
     *
     * @param versionId 版本 ID
     */
    void incrementDownloadCount(Long versionId);
}
