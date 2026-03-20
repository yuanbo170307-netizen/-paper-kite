package com.appspaces.boot.app.app.component;

import com.appspaces.boot.app.app.entity.AppEntity;
import com.appspaces.boot.app.version.entity.AppVersionEntity;
import org.springframework.stereotype.Component;

/**
 * iOS manifest.plist 动态生成组件
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Component
public class ManifestPlistComponent {

    private static final String PLIST_TEMPLATE =
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
            + "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\"\n"
            + "  \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n"
            + "<plist version=\"1.0\">\n"
            + "<dict>\n"
            + "  <key>items</key>\n"
            + "  <array>\n"
            + "    <dict>\n"
            + "      <key>assets</key>\n"
            + "      <array>\n"
            + "        <dict>\n"
            + "          <key>kind</key>\n"
            + "          <string>software-package</string>\n"
            + "          <key>url</key>\n"
            + "          <string>%s</string>\n"
            + "        </dict>\n"
            + "        <dict>\n"
            + "          <key>kind</key>\n"
            + "          <string>display-image</string>\n"
            + "          <key>url</key>\n"
            + "          <string>%s</string>\n"
            + "        </dict>\n"
            + "      </array>\n"
            + "      <key>metadata</key>\n"
            + "      <dict>\n"
            + "        <key>bundle-identifier</key>\n"
            + "        <string>%s</string>\n"
            + "        <key>bundle-version</key>\n"
            + "        <string>%s</string>\n"
            + "        <key>kind</key>\n"
            + "        <string>software</string>\n"
            + "        <key>title</key>\n"
            + "        <string>%s</string>\n"
            + "      </dict>\n"
            + "    </dict>\n"
            + "  </array>\n"
            + "</dict>\n"
            + "</plist>";

    /**
     * 生成 manifest.plist 内容
     *
     * @param ipaUrl  IPA 下载地址（HTTPS）
     * @param iconUrl 图标地址（HTTPS）
     * @param app     应用实体
     * @param version 版本实体
     * @return manifest.plist XML 内容
     */
    public String generate(String ipaUrl, String iconUrl,
                           AppEntity app, AppVersionEntity version) {
        return String.format(PLIST_TEMPLATE,
                ipaUrl,
                iconUrl,
                app.getBundleId(),
                version.getVersionName(),
                app.getName());
    }
}
