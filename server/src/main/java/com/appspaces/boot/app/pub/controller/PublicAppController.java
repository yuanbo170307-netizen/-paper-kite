package com.appspaces.boot.app.pub.controller;

import com.appspaces.boot.app.app.common.enums.AccessTypeEnum;
import com.appspaces.boot.app.app.common.enums.PlatformEnum;
import com.appspaces.boot.app.app.component.ManifestPlistComponent;
import com.appspaces.boot.app.app.component.QrCodeComponent;
import com.appspaces.boot.app.app.entity.AppEntity;
import com.appspaces.boot.app.app.model.request.VerifyPasswordRequest;
import com.appspaces.boot.app.app.model.response.PublicAppResponse;
import com.appspaces.boot.app.app.service.AppService;
import com.appspaces.boot.app.version.entity.AppVersionEntity;
import com.appspaces.boot.app.version.model.response.AppVersionResponse;
import com.appspaces.boot.app.version.service.AppVersionService;
import com.appspaces.commons.controller.AbstractApiController;
import com.appspaces.commons.exception.BizRuntimeException;
import com.appspaces.commons.model.ApiResponse;
import com.appspaces.storage.service.OssStorageService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.util.StreamUtils;
import org.springframework.util.StringUtils;

import java.io.InputStream;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Objects;

/**
 * 公开下载接口（无需登录）
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@RestController
@RequestMapping("/api")
public class PublicAppController extends AbstractApiController {

    @Value("${appspaces.base-url}")
    private String baseUrl;

    @Autowired
    private AppService appService;

    @Autowired
    private AppVersionService appVersionService;

    @Autowired
    private OssStorageService ossStorageService;

    @Autowired
    private ManifestPlistComponent manifestPlistComponent;

    @Autowired
    private QrCodeComponent qrCodeComponent;

    /**
     * 获取应用信息 + 当前版本
     *
     * @param appKey 应用标识
     * @return 应用公开信息
     */
    @GetMapping("/public/{appKey}")
    public ApiResponse<PublicAppResponse> getApp(@PathVariable String appKey) {
        AppEntity app = appService.getByAppKey(appKey);
        PublicAppResponse response = new PublicAppResponse();
        response.setAppKey(app.getAppKey());
        response.setName(app.getName());
        response.setPlatform(app.getPlatform());
        response.setAccessType(app.getAccessType());

        if (StringUtils.hasText(app.getIconPath())) {
            response.setIconUrl(ossStorageService.getUrl(app.getIconPath()));
        }

        // 填充当前版本信息
        if (Objects.nonNull(app.getCurrentVersionId())) {
            AppVersionEntity version = appVersionService.getById(app.getCurrentVersionId());
            AppVersionResponse versionResponse = new AppVersionResponse();
            BeanUtils.copyProperties(version, versionResponse);
            versionResponse.setDownloadUrl(ossStorageService.getUrl(version.getFilePath()));
            response.setCurrentVersion(versionResponse);
        }

        return setContext(response);
    }

    /**
     * 获取应用信息 + 指定版本
     *
     * @param appKey    应用标识
     * @param versionId 版本 ID
     * @return 应用公开信息（指定版本）
     */
    @GetMapping("/public/{appKey}/{versionId}")
    public ApiResponse<PublicAppResponse> getAppVersion(@PathVariable String appKey,
                                                        @PathVariable Long versionId) {
        AppEntity app = appService.getByAppKey(appKey);
        PublicAppResponse response = new PublicAppResponse();
        response.setAppKey(app.getAppKey());
        response.setName(app.getName());
        response.setPlatform(app.getPlatform());
        response.setAccessType(app.getAccessType());

        if (StringUtils.hasText(app.getIconPath())) {
            response.setIconUrl(ossStorageService.getUrl(app.getIconPath()));
        }

        AppVersionEntity version = appVersionService.getById(versionId);
        AppVersionResponse versionResponse = new AppVersionResponse();
        BeanUtils.copyProperties(version, versionResponse);
        versionResponse.setDownloadUrl(ossStorageService.getUrl(version.getFilePath()));
        response.setCurrentVersion(versionResponse);

        return setContext(response);
    }

    /**
     * 获取应用的版本历史列表（分页）
     *
     * @param appKey 应用标识
     * @param page   页码（从 1 开始，默认 1）
     * @param size   每页数量（默认 5）
     * @return 版本列表
     */
    @GetMapping("/public/{appKey}/versions")
    public ApiResponse<List<AppVersionResponse>> getVersions(@PathVariable String appKey,
                                                              @RequestParam(defaultValue = "1") int page,
                                                              @RequestParam(defaultValue = "5") int size) {
        AppEntity app = appService.getByAppKey(appKey);
        List<AppVersionResponse> versionList = appVersionService.listByAppPaged(app.getId(), page, size);
        return setContext(versionList);
    }

    /**
     * 验证访问密码
     *
     * @param appKey  应用标识
     * @param request 密码请求
     * @return 验证结果
     */
    @PostMapping("/public/{appKey}/verify")
    public ApiResponse<Boolean> verify(@PathVariable String appKey,
                                       @Validated @RequestBody VerifyPasswordRequest request) {
        AppEntity app = appService.getByAppKey(appKey);
        if (AccessTypeEnum.PASSWORD.getCode() != app.getAccessType()) {
            return setContext(true);
        }
        boolean valid = request.getPassword().equals(app.getAccessPassword());
        if (!valid) {
            throw new BizRuntimeException("password incorrect");
        }
        return setContext(true);
    }

    /**
     * 下载安装包（302 重定向到 OSS）
     *
     * @param versionId 版本 ID
     * @param response  HTTP 响应
     * @throws IOException 重定向异常
     */
    @GetMapping("/download/{versionId}")
    public void download(@PathVariable Long versionId,
                         HttpServletResponse response) throws IOException {
        AppVersionEntity version = appVersionService.getById(versionId);
        appVersionService.incrementDownloadCount(versionId);

        String filePath = version.getFilePath();
        String fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
        String contentType = fileName.endsWith(".ipa") ? "application/octet-stream" : "application/vnd.android.package-archive";

        response.setContentType(contentType);
        response.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"");
        response.setHeader("Content-Length", String.valueOf(ossStorageService.getObjectSize(filePath)));

        try (InputStream in = ossStorageService.getObject(filePath)) {
            StreamUtils.copy(in, response.getOutputStream());
        }
    }

    /**
     * iOS manifest.plist（动态生成）
     *
     * @param versionId 版本 ID
     * @param response  HTTP 响应
     * @throws IOException 写入异常
     */
    @GetMapping("/manifest/{versionId}.plist")
    public void manifest(@PathVariable Long versionId,
                         HttpServletResponse response) throws IOException {
        AppVersionEntity version = appVersionService.getById(versionId);
        AppEntity app = appService.getById(version.getAppId());

        if (app.getPlatform() != PlatformEnum.IOS.getCode()) {
            throw new BizRuntimeException("only iOS apps support manifest install");
        }

        String ipaUrl = baseUrl + "/api/download/" + versionId;
        // 用 /api/icon/{appId} 接口而非 OSS 签名 URL，避免 URL 中的 & 破坏 plist XML 格式
        String iconUrl = StringUtils.hasText(app.getIconPath())
                ? baseUrl + "/api/icon/" + app.getId()
                : "";

        String plistXml = manifestPlistComponent.generate(ipaUrl, iconUrl, app, version);

        response.setContentType("application/xml");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(plistXml);
    }

    /**
     * 应用图标（302 到 OSS）
     *
     * @param appId    应用 ID
     * @param response HTTP 响应
     * @throws IOException 重定向异常
     */
    @GetMapping("/icon/{appId}")
    public void icon(@PathVariable Long appId,
                     HttpServletResponse response) throws IOException {
        AppEntity app = appService.getById(appId);
        if (!StringUtils.hasText(app.getIconPath())) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }
        response.sendRedirect(ossStorageService.getUrl(app.getIconPath()));
    }

    /**
     * 生成二维码
     *
     * @param appKey   应用标识
     * @param response HTTP 响应
     * @throws Exception 生成异常
     */
    @GetMapping("/qrcode/{appKey}")
    public void qrcode(@PathVariable String appKey,
                       HttpServletResponse response) throws Exception {
        // 验证应用存在
        appService.getByAppKey(appKey);

        String downloadPageUrl = baseUrl + "/d/" + appKey;
        byte[] imageData = qrCodeComponent.generate(downloadPageUrl);

        response.setContentType(MediaType.IMAGE_PNG_VALUE);
        response.getOutputStream().write(imageData);
    }
}
