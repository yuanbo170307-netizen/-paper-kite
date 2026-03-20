package com.appspaces.boot.app.app.component;

import net.dongliu.apk.parser.ApkFile;
import net.dongliu.apk.parser.bean.ApkMeta;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;

/**
 * APK 安装包解析组件
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Component
public class ApkParserComponent {

    private static final Logger log = LoggerFactory.getLogger(ApkParserComponent.class);

    /**
     * 解析 APK 文件，提取应用元信息
     *
     * @param file APK 文件
     * @return 解析结果，包含 bundleId、versionName、versionCode、appName、minOsVersion、icon
     * @throws IOException 文件读取异常
     */
    public Map<String, Object> parse(MultipartFile file) throws IOException {
        // apk-parser 需要 File 对象，先写临时文件
        File tempFile = Files.createTempFile("apk_", ".apk").toFile();
        try {
            file.transferTo(tempFile);

            try (ApkFile apkFile = new ApkFile(tempFile)) {
                ApkMeta meta = apkFile.getApkMeta();

                Map<String, Object> result = new HashMap<>(8);
                result.put("bundleId", meta.getPackageName());
                result.put("versionName", meta.getVersionName());
                result.put("versionCode", meta.getVersionCode() != null
                        ? meta.getVersionCode().intValue() : 0);
                result.put("appName", meta.getLabel());
                result.put("minOsVersion", meta.getMinSdkVersion());

                // 提取图标
                byte[] iconData = apkFile.getIconFile().getData();
                result.put("icon", iconData);

                return result;
            }
        } finally {
            tempFile.delete();
        }
    }
}
