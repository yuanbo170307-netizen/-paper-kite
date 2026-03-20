package com.appspaces.boot.app.open.controller;

import com.appspaces.boot.app.app.model.response.AppResponse;
import com.appspaces.boot.app.app.service.AppService;
import com.appspaces.commons.controller.AbstractApiController;
import com.appspaces.commons.exception.BizRuntimeException;
import com.appspaces.commons.model.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 开放接口（供 Jenkins 等 CI/CD 工具调用）
 * <p>
 * 使用 API Token 认证，通过 Header X-Api-Token 传递。
 *
 * @author liyuanbo
 * @create 2026/03/20
 */
@RestController
@RequestMapping("/api/open")
public class OpenApiController extends AbstractApiController {

    @Value("${appspaces.api-token}")
    private String apiToken;

    @Autowired
    private AppService appService;

    /**
     * CI/CD 上传安装包
     * <p>
     * 示例：
     * curl -X POST https://appspace.gzshujiu.com/api/open/upload \
     *   -H "X-Api-Token: your-token" \
     *   -F "file=@app-release.apk" \
     *   -F "environment=release" \
     *   -F "changelog=Jenkins Build #123"
     *
     * @param token       API Token（Header）
     * @param file        安装包文件（IPA/APK）
     * @param versionName 版本号（可选，不填则从包解析）
     * @param environment 环境：dev/test/release（默认 release）
     * @param changelog   更新说明（可选）
     * @return 应用信息
     */
    @PostMapping("/upload")
    public ApiResponse<AppResponse> upload(@RequestHeader("X-Api-Token") String token,
                                           @RequestParam("file") MultipartFile file,
                                           @RequestParam(value = "versionName", required = false) String versionName,
                                           @RequestParam(value = "environment", defaultValue = "release") String environment,
                                           @RequestParam(value = "changelog", required = false) String changelog) {
        // 验证 Token
        if (!StringUtils.hasText(token) || !token.equals(apiToken)) {
            throw new BizRuntimeException(401, "invalid api token");
        }

        AppResponse response = appService.upload(file, versionName, environment, changelog);
        return setContext(response);
    }
}
