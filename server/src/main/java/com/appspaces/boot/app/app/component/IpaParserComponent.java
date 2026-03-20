package com.appspaces.boot.app.app.component;

import com.appspaces.common.utils.IphonePngUtils;
import com.dd.plist.NSArray;
import com.dd.plist.NSDictionary;
import com.dd.plist.NSObject;
import com.dd.plist.PropertyListFormatException;
import com.dd.plist.PropertyListParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.xml.sax.SAXException;

import javax.xml.parsers.ParserConfigurationException;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * IPA 安装包解析组件
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Component
public class IpaParserComponent {

    private static final Logger log = LoggerFactory.getLogger(IpaParserComponent.class);

    /**
     * 解析 IPA 文件，提取应用元信息
     *
     * @param file IPA 文件
     * @return 解析结果，包含 bundleId、versionName、versionCode、appName、minOsVersion、icon
     * @throws IOException 文件读取异常
     */
    public Map<String, Object> parse(MultipartFile file) throws IOException, PropertyListFormatException,
            ParseException, ParserConfigurationException, SAXException {
        Map<String, Object> result = new HashMap<>(8);
        byte[] iconData = null;
        NSDictionary infoPlist = null;

        // 第一遍遍历：读取 Info.plist 和所有 .app 下的 png 文件名
        Map<String, byte[]> pngFileMap = new HashMap<>(16);

        try (ZipInputStream zis = new ZipInputStream(file.getInputStream())) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                String name = entry.getName();

                // 查找 Info.plist
                if (name.matches("Payload/[^/]+\\.app/Info\\.plist")) {
                    byte[] plistData = readEntryData(zis);
                    infoPlist = (NSDictionary) PropertyListParser.parse(plistData);
                }

                // 收集 .app 根目录下的 png 文件（图标候选）
                if (name.matches("Payload/[^/]+\\.app/[^/]+\\.png")) {
                    pngFileMap.put(name, readEntryData(zis));
                }

                zis.closeEntry();
            }
        }

        if (infoPlist == null) {
            throw new IOException("未找到 Info.plist");
        }

        // 从 CFBundleIcons 中解析图标文件名
        List<String> iconBaseNameList = getIconBaseNameList(infoPlist);
        if (!iconBaseNameList.isEmpty()) {
            iconData = findBestIcon(iconBaseNameList, pngFileMap);
        }

        // 兜底：如果 CFBundleIcons 没拿到，按常见文件名匹配
        if (iconData == null) {
            iconData = findIconByFallback(pngFileMap);
        }

        result.put("bundleId", getStringValue(infoPlist, "CFBundleIdentifier"));
        result.put("versionName", getStringValue(infoPlist, "CFBundleShortVersionString"));
        result.put("appName", getDisplayName(infoPlist));
        result.put("minOsVersion", getStringValue(infoPlist, "MinimumOSVersion"));

        // CgBI PNG 转标准 PNG，否则浏览器无法显示
        if (iconData != null) {
            iconData = IphonePngUtils.normalize(iconData);
        }
        result.put("icon", iconData);

        // versionCode 从 CFBundleVersion 解析
        String buildVersion = getStringValue(infoPlist, "CFBundleVersion");
        try {
            result.put("versionCode", Integer.parseInt(buildVersion));
        } catch (NumberFormatException e) {
            result.put("versionCode", 0);
        }

        return result;
    }

    /**
     * 从 Info.plist 的 CFBundleIcons 中提取图标基础文件名列表
     *
     * @param infoPlist Info.plist 字典
     * @return 图标基础文件名列表（如 AppIcon60x60）
     */
    private List<String> getIconBaseNameList(NSDictionary infoPlist) {
        List<String> nameList = new ArrayList<>();
        try {
            NSDictionary icons = (NSDictionary) infoPlist.get("CFBundleIcons");
            if (icons == null) {
                icons = (NSDictionary) infoPlist.get("CFBundleIcons~ipad");
            }
            if (icons == null) {
                return nameList;
            }
            NSDictionary primaryIcon = (NSDictionary) icons.get("CFBundlePrimaryIcon");
            if (primaryIcon == null) {
                return nameList;
            }
            NSObject iconFilesObj = primaryIcon.get("CFBundleIconFiles");
            if (iconFilesObj instanceof NSArray) {
                NSArray iconFiles = (NSArray) iconFilesObj;
                for (NSObject item : iconFiles.getArray()) {
                    nameList.add(item.toJavaObject().toString());
                }
            }
        } catch (Exception e) {
            log.warn("IpaParserComponent#getIconBaseNameList 解析 CFBundleIcons 失败", e);
        }
        return nameList;
    }

    /**
     * 根据 CFBundleIconFiles 中的基础文件名，在 png 文件中查找最大分辨率的图标
     * CFBundleIconFiles 中的名称是基础名（如 AppIcon60x60），实际文件会带 @2x/@3x 后缀
     *
     * @param iconBaseNameList 图标基础文件名列表
     * @param pngFileMap       IPA 中的 png 文件映射
     * @return 图标数据
     */
    private byte[] findBestIcon(List<String> iconBaseNameList, Map<String, byte[]> pngFileMap) {
        // 优先找 @3x，再 @2x，最后无后缀
        String[] suffixList = {"@3x.png", "@2x.png", ".png"};

        for (String suffix : suffixList) {
            // 倒序遍历 iconBaseNameList，通常最后一个是最大尺寸
            for (int i = iconBaseNameList.size() - 1; i >= 0; i--) {
                String baseName = iconBaseNameList.get(i);
                String target = baseName.endsWith(".png") ? baseName : baseName + suffix;
                for (Map.Entry<String, byte[]> entry : pngFileMap.entrySet()) {
                    if (entry.getKey().endsWith("/" + target)) {
                        return entry.getValue();
                    }
                }
            }
        }
        return null;
    }

    /**
     * 兜底方案：按常见图标文件名模式查找
     *
     * @param pngFileMap IPA 中的 png 文件映射
     * @return 图标数据
     */
    private byte[] findIconByFallback(Map<String, byte[]> pngFileMap) {
        // 按优先级匹配常见图标文件名
        String[] patternList = {
                "AppIcon60x60@3x.png",
                "AppIcon60x60@2x.png",
                "AppIcon76x76@2x.png",
                "Icon-60@3x.png",
                "Icon-60@2x.png",
                "Icon@2x.png",
                "Icon.png"
        };
        for (String pattern : patternList) {
            for (Map.Entry<String, byte[]> entry : pngFileMap.entrySet()) {
                if (entry.getKey().endsWith("/" + pattern)) {
                    return entry.getValue();
                }
            }
        }
        // 最终兜底：取任意含 AppIcon 的 png
        for (Map.Entry<String, byte[]> entry : pngFileMap.entrySet()) {
            String fileName = entry.getKey().substring(entry.getKey().lastIndexOf('/') + 1);
            if (fileName.contains("AppIcon")) {
                return entry.getValue();
            }
        }
        return null;
    }

    /**
     * 获取应用显示名称
     *
     * @param dict Info.plist 字典
     * @return 显示名称
     */
    private String getDisplayName(NSDictionary dict) {
        String displayName = getStringValue(dict, "CFBundleDisplayName");
        if (displayName == null || displayName.isEmpty()) {
            displayName = getStringValue(dict, "CFBundleName");
        }
        return displayName;
    }

    /**
     * 从 plist 字典中获取字符串值
     *
     * @param dict plist 字典
     * @param key  键名
     * @return 字符串值
     */
    private String getStringValue(NSDictionary dict, String key) {
        NSObject value = dict.get(key);
        return value != null ? value.toJavaObject().toString() : null;
    }

    /**
     * 读取 ZipInputStream 当前 entry 的完整数据
     *
     * @param zis ZipInputStream
     * @return 字节数组
     * @throws IOException 读取异常
     */
    private byte[] readEntryData(ZipInputStream zis) throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int len;
        while ((len = zis.read(buffer)) != -1) {
            bos.write(buffer, 0, len);
        }
        return bos.toByteArray();
    }
}
