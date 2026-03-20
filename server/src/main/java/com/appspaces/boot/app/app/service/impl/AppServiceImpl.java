package com.appspaces.boot.app.app.service.impl;

import com.appspaces.boot.app.app.component.ApkParserComponent;
import com.appspaces.boot.app.app.component.IpaParserComponent;
import com.appspaces.boot.app.app.common.enums.AccessTypeEnum;
import com.appspaces.boot.app.app.common.enums.PlatformEnum;
import com.appspaces.boot.app.app.entity.AppEntity;
import com.appspaces.boot.app.app.model.response.AppResponse;
import com.appspaces.boot.app.app.model.request.UpdateAppRequest;
import com.appspaces.boot.app.app.repository.AppRepository;
import com.appspaces.boot.app.app.service.AppService;
// project 概念已移除，App 按 bundleId + platform 全局去重
import com.appspaces.boot.app.version.entity.AppVersionEntity;
import com.appspaces.boot.app.version.repository.AppVersionRepository;
import com.appspaces.boot.app.version.service.AppVersionService;
import com.appspaces.commons.exception.BizRuntimeException;
import com.appspaces.storage.service.OssStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 应用服务实现
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Service
public class AppServiceImpl implements AppService {

    private static final Logger log = LoggerFactory.getLogger(AppServiceImpl.class);

    @Autowired
    private AppRepository appRepository;

    @Autowired
    private AppVersionRepository appVersionRepository;

    @Autowired
    private AppVersionService appVersionService;

    @Autowired
    private OssStorageService ossStorageService;

    @Autowired
    private IpaParserComponent ipaParserComponent;

    @Autowired
    private ApkParserComponent apkParserComponent;

    @Override
    @Transactional(rollbackFor = Exception.class, isolation = Isolation.READ_COMMITTED)
    public AppResponse upload(MultipartFile file, String versionNameInput,
                              String environment, String changelog) {
        String fileName = file.getOriginalFilename();
        if (!StringUtils.hasText(fileName)) {
            throw new BizRuntimeException("文件名为空");
        }

        // 先缓存文件字节，避免解析后临时文件被清理
        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            log.error("AppServiceImpl#upload 读取文件失败，fileName={}", fileName, e);
            throw new BizRuntimeException("文件读取失败");
        }
        long fileSize = fileBytes.length;

        // 解析安装包
        Map<String, Object> parseResult;
        int platform;
        try {
            if (fileName.toLowerCase().endsWith(".ipa")) {
                parseResult = ipaParserComponent.parse(file);
                platform = PlatformEnum.IOS.getCode();
            } else if (fileName.toLowerCase().endsWith(".apk")) {
                parseResult = apkParserComponent.parse(file);
                platform = PlatformEnum.ANDROID.getCode();
            } else {
                throw new BizRuntimeException("不支持的文件格式，仅支持 IPA/APK");
            }
        } catch (BizRuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("AppServiceImpl#upload 解析安装包失败，fileName={}", fileName, e);
            throw new BizRuntimeException("安装包解析失败");
        }

        String bundleId = (String) parseResult.get("bundleId");
        // 手动填写的版本号优先，否则从包解析
        String versionName = StringUtils.hasText(versionNameInput)
                ? versionNameInput : (String) parseResult.get("versionName");
        Integer versionCode = (Integer) parseResult.get("versionCode");
        String appName = (String) parseResult.get("appName");
        String minOsVersion = (String) parseResult.get("minOsVersion");
        byte[] iconData = (byte[]) parseResult.get("icon");

        // 查找或创建应用（按 bundleId + platform 全局匹配）
        AppEntity appEntity = findOrCreateApp(bundleId, appName, platform);

        // 并行上传：安装包 + 图标同时传 OSS
        String objectKey = buildObjectKey(appEntity.getAppKey(), versionName, fileName);
        java.util.concurrent.CompletableFuture<Void> uploadFuture = java.util.concurrent.CompletableFuture.runAsync(() ->
                ossStorageService.upload(objectKey, new java.io.ByteArrayInputStream(fileBytes)));

        java.util.concurrent.CompletableFuture<Void> iconFuture = java.util.concurrent.CompletableFuture.completedFuture(null);
        String iconKey = null;
        if (iconData != null && iconData.length > 0) {
            String ik = "appspaces/" + appEntity.getAppKey() + "/icon.png";
            iconKey = ik;
            byte[] iconBytes = iconData;
            iconFuture = java.util.concurrent.CompletableFuture.runAsync(() ->
                    ossStorageService.upload(ik, new java.io.ByteArrayInputStream(iconBytes)));
        }

        // 等待两个上传都完成
        try {
            java.util.concurrent.CompletableFuture.allOf(uploadFuture, iconFuture).join();
        } catch (Exception e) {
            log.error("AppServiceImpl#upload OSS 上传失败", e);
            throw new BizRuntimeException("文件上传失败");
        }

        if (iconKey != null) {
            appEntity.setIconPath(iconKey);
        }

        // 创建版本
        AppVersionEntity version = new AppVersionEntity();
        version.setAppId(appEntity.getId());
        version.setVersionName(versionName);
        version.setVersionCode(versionCode != null ? versionCode : 0);
        version.setFilePath(objectKey);
        version.setFileSize(fileSize);
        version.setChangelog(changelog);
        version.setEnvironment(StringUtils.hasText(environment) ? environment : "test");
        version.setMinOsVersion(minOsVersion);
        version.setDownloadCount(0L);
        version.setCreateTime(new Date());
        version.setUpdateTime(new Date());
        appVersionRepository.insertSelective(version);

        // 更新当前版本
        appEntity.setCurrentVersionId(version.getId());
        appEntity.setName(appName);
        appEntity.setUpdateTime(new Date());
        appRepository.updateByPrimaryKeySelective(appEntity);

        return toResponse(appEntity);
    }

    @Override
    public List<AppResponse> listAll() {
        List<AppEntity> entityList = appRepository.selectAll();
        return entityList.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class, isolation = Isolation.READ_COMMITTED)
    public AppResponse update(Long appId, UpdateAppRequest request) {
        AppEntity entity = getById(appId);
        if (Objects.nonNull(request.getName())) {
            entity.setName(request.getName());
        }
        if (Objects.nonNull(request.getAccessType())) {
            entity.setAccessType(request.getAccessType());
        }
        if (Objects.nonNull(request.getAccessPassword())) {
            entity.setAccessPassword(request.getAccessPassword());
        }
        entity.setUpdateTime(new Date());
        appRepository.updateByPrimaryKeySelective(entity);

        return toResponse(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class, isolation = Isolation.READ_COMMITTED)
    public AppResponse uploadIcon(Long appId, MultipartFile file) {
        AppEntity entity = getById(appId);
        String iconKey = "appspaces/" + entity.getAppKey() + "/icon.png";
        try {
            ossStorageService.upload(iconKey, file.getInputStream());
        } catch (IOException e) {
            log.error("AppServiceImpl#uploadIcon 上传图标失败，appId={}", appId, e);
            throw new BizRuntimeException("图标上传失败");
        }
        entity.setIconPath(iconKey);
        entity.setUpdateTime(new Date());
        appRepository.updateByPrimaryKeySelective(entity);
        return toResponse(entity);
    }

    @Override
    public AppResponse getDetail(Long appId) {
        return toResponse(getById(appId));
    }

    @Override
    @Transactional(rollbackFor = Exception.class, isolation = Isolation.READ_COMMITTED)
    public void setCurrentVersion(Long appId, Long versionId) {
        AppEntity appEntity = getById(appId);

        // 校验版本属于该应用
        AppVersionEntity version = appVersionService.getById(versionId);
        if (!version.getAppId().equals(appId)) {
            throw new BizRuntimeException("版本不属于该应用");
        }

        appEntity.setCurrentVersionId(versionId);
        appEntity.setUpdateTime(new Date());
        appRepository.updateByPrimaryKeySelective(appEntity);
    }

    @Override
    public AppEntity getById(Long appId) {
        AppEntity entity = appRepository.selectByPrimaryKey(appId);
        if (Objects.isNull(entity)) {
            throw new BizRuntimeException("应用不存在");
        }
        return entity;
    }

    @Override
    public AppEntity getByAppKey(String appKey) {
        AppEntity query = new AppEntity();
        query.setAppKey(appKey);
        AppEntity entity = appRepository.selectOne(query);
        if (Objects.isNull(entity)) {
            throw new BizRuntimeException("应用不存在");
        }
        return entity;
    }

    /**
     * 按 bundleId + platform 全局查找或创建应用
     *
     * @param bundleId 包名
     * @param appName  应用名
     * @param platform 平台
     * @return 应用实体
     */
    private AppEntity findOrCreateApp(String bundleId, String appName, int platform) {
        AppEntity query = new AppEntity();
        query.setBundleId(bundleId);
        query.setPlatform(platform);
        AppEntity existing = appRepository.selectOne(query);
        if (Objects.nonNull(existing)) {
            return existing;
        }

        AppEntity entity = new AppEntity();
        entity.setAppKey(generateAppKey());
        entity.setBundleId(bundleId);
        entity.setName(appName);
        entity.setPlatform(platform);
        entity.setAccessType(AccessTypeEnum.PUBLIC.getCode());
        entity.setDownloadCount(0L);
        entity.setCreateTime(new Date());
        entity.setUpdateTime(new Date());
        appRepository.insertSelective(entity);

        return entity;
    }

    /**
     * 生成应用唯一标识
     *
     * @return appKey
     */
    private String generateAppKey() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }

    /**
     * 构建 OSS 对象路径
     *
     * @param appKey   应用标识
     * @param version  版本号
     * @param fileName 文件名
     * @return OSS 对象路径
     */
    private String buildObjectKey(String appKey, String version, String fileName) {
        return "appspaces/" + appKey + "/" + version + "/" + fileName;
    }

    /**
     * 实体转响应对象
     *
     * @param entity 应用实体
     * @return 应用响应
     */
    private AppResponse toResponse(AppEntity entity) {
        AppResponse response = new AppResponse();
        BeanUtils.copyProperties(entity, response);
        if (StringUtils.hasText(entity.getIconPath())) {
            response.setIconUrl(ossStorageService.getUrl(entity.getIconPath()));
        }
        return response;
    }
}
