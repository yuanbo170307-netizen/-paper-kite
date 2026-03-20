package com.appspaces.boot.app.app.component;

import com.dd.plist.BinaryPropertyListWriter;
import com.dd.plist.NSArray;
import com.dd.plist.NSDictionary;
import com.dd.plist.NSString;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * IpaParserComponent 单元测试
 *
 * @author liyuanbo
 * @create 2026/03/21
 */
class IpaParserComponentTest {

    private IpaParserComponent ipaParserComponent;

    /**
     * 创建一个最小合法标准 PNG（1x1 红色像素）
     * 非 CgBI 格式，normalize 会原样返回
     */
    private static byte[] createMinimalPng() {
        return new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                // IHDR
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                0x08, 0x02, 0x00, 0x00, 0x00, (byte) 0x90, 0x77, 0x53,
                (byte) 0xDE,
                // IDAT
                0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54,
                0x08, (byte) 0xD7, 0x63, (byte) 0xF8, (byte) 0xCF, (byte) 0xC0, 0x00, 0x00,
                0x00, 0x02, 0x00, 0x01, (byte) 0xE2, 0x21, (byte) 0xBC, 0x33,
                // IEND
                0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
                (byte) 0xAE, 0x42, 0x60, (byte) 0x82
        };
    }

    /**
     * 构建二进制 Info.plist 数据
     *
     * @param bundleId    包名
     * @param versionName 版本号
     * @param buildNumber 构建号
     * @param appName     应用名
     * @param iconNames   CFBundleIconFiles 中的图标基础名（可为 null 表示不含图标信息）
     * @return 二进制 plist 字节
     */
    private static byte[] buildInfoPlist(String bundleId, String versionName,
                                         String buildNumber, String appName,
                                         String[] iconNames) throws IOException {
        NSDictionary root = new NSDictionary();
        root.put("CFBundleIdentifier", new NSString(bundleId));
        root.put("CFBundleShortVersionString", new NSString(versionName));
        root.put("CFBundleVersion", new NSString(buildNumber));
        root.put("CFBundleDisplayName", new NSString(appName));
        root.put("MinimumOSVersion", new NSString("14.0"));

        if (iconNames != null) {
            NSDictionary icons = new NSDictionary();
            NSDictionary primaryIcon = new NSDictionary();
            NSArray iconFiles = new NSArray(iconNames.length);
            for (int i = 0; i < iconNames.length; i++) {
                iconFiles.setValue(i, new NSString(iconNames[i]));
            }
            primaryIcon.put("CFBundleIconFiles", iconFiles);
            icons.put("CFBundlePrimaryIcon", primaryIcon);
            root.put("CFBundleIcons", icons);
        }

        return BinaryPropertyListWriter.writeToArray(root);
    }

    /**
     * 构建模拟 IPA 文件（zip 格式）
     *
     * @param appDirName .app 目录名
     * @param plistData  Info.plist 二进制数据
     * @param pngEntries 额外的 png 文件条目 {文件名 -> 数据}
     * @return IPA zip 字节
     */
    private static byte[] buildFakeIpa(String appDirName,
                                       byte[] plistData,
                                       Map<String, byte[]> pngEntries) throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(bos)) {
            // Info.plist
            zos.putNextEntry(new ZipEntry("Payload/" + appDirName + "/Info.plist"));
            zos.write(plistData);
            zos.closeEntry();

            // png 文件
            if (pngEntries != null) {
                for (Map.Entry<String, byte[]> entry : pngEntries.entrySet()) {
                    zos.putNextEntry(new ZipEntry("Payload/" + appDirName + "/" + entry.getKey()));
                    zos.write(entry.getValue());
                    zos.closeEntry();
                }
            }
        }
        return bos.toByteArray();
    }

    @BeforeEach
    void setUp() {
        ipaParserComponent = new IpaParserComponent();
    }

    /**
     * 测试通过 CFBundleIcons 正确获取图标（@3x 优先）
     */
    @Test
    void testParseWithCFBundleIcons() throws Exception {
        byte[] pngData = createMinimalPng();
        byte[] plistData = buildInfoPlist(
                "com.test.app", "1.2.0", "42", "TestApp",
                new String[]{"AppIcon20x20", "AppIcon60x60"}
        );

        java.util.Map<String, byte[]> pngEntries = new java.util.LinkedHashMap<>();
        pngEntries.put("AppIcon20x20@2x.png", new byte[]{1, 2, 3});
        pngEntries.put("AppIcon60x60@2x.png", pngData);
        pngEntries.put("AppIcon60x60@3x.png", pngData);

        byte[] ipaBytes = buildFakeIpa("TestApp.app", plistData, pngEntries);
        MockMultipartFile file = new MockMultipartFile("file", "test.ipa", "application/octet-stream", ipaBytes);

        Map<String, Object> result = ipaParserComponent.parse(file);

        assertEquals("com.test.app", result.get("bundleId"));
        assertEquals("1.2.0", result.get("versionName"));
        assertEquals("TestApp", result.get("appName"));
        assertEquals(42, result.get("versionCode"));
        assertEquals("14.0", result.get("minOsVersion"));
        // 应该拿到图标（@3x 优先）
        assertNotNull(result.get("icon"), "应通过 CFBundleIcons 找到图标");
    }

    /**
     * 测试非标准图标文件名（自定义名称），通过 CFBundleIcons 获取
     */
    @Test
    void testParseWithCustomIconName() throws Exception {
        byte[] pngData = createMinimalPng();
        byte[] plistData = buildInfoPlist(
                "com.custom.app", "2.0.0", "100", "CustomApp",
                new String[]{"MyCustomIcon40x40", "MyCustomIcon60x60"}
        );

        java.util.Map<String, byte[]> pngEntries = new java.util.LinkedHashMap<>();
        // 这些文件名在旧代码中完全匹配不到
        pngEntries.put("MyCustomIcon40x40@2x.png", pngData);
        pngEntries.put("MyCustomIcon60x60@2x.png", pngData);

        byte[] ipaBytes = buildFakeIpa("CustomApp.app", plistData, pngEntries);
        MockMultipartFile file = new MockMultipartFile("file", "custom.ipa", "application/octet-stream", ipaBytes);

        Map<String, Object> result = ipaParserComponent.parse(file);

        assertEquals("com.custom.app", result.get("bundleId"));
        assertNotNull(result.get("icon"), "自定义图标名应通过 CFBundleIcons 找到");
    }

    /**
     * 测试无 CFBundleIcons 但有标准文件名的情况（兜底逻辑）
     */
    @Test
    void testParseWithFallbackIconName() throws Exception {
        byte[] pngData = createMinimalPng();
        // iconNames = null 表示 Info.plist 中没有 CFBundleIcons
        byte[] plistData = buildInfoPlist(
                "com.old.app", "1.0.0", "1", "OldApp", null
        );

        java.util.Map<String, byte[]> pngEntries = new java.util.LinkedHashMap<>();
        pngEntries.put("AppIcon60x60@2x.png", pngData);

        byte[] ipaBytes = buildFakeIpa("OldApp.app", plistData, pngEntries);
        MockMultipartFile file = new MockMultipartFile("file", "old.ipa", "application/octet-stream", ipaBytes);

        Map<String, Object> result = ipaParserComponent.parse(file);

        assertEquals("com.old.app", result.get("bundleId"));
        assertNotNull(result.get("icon"), "无 CFBundleIcons 时应通过兜底文件名找到图标");
    }

    /**
     * 测试完全无图标的情况
     */
    @Test
    void testParseWithNoIcon() throws Exception {
        byte[] plistData = buildInfoPlist(
                "com.noicon.app", "1.0.0", "1", "NoIconApp", null
        );

        byte[] ipaBytes = buildFakeIpa("NoIconApp.app", plistData, null);
        MockMultipartFile file = new MockMultipartFile("file", "noicon.ipa", "application/octet-stream", ipaBytes);

        Map<String, Object> result = ipaParserComponent.parse(file);

        assertEquals("com.noicon.app", result.get("bundleId"));
        assertNull(result.get("icon"), "无图标文件时 icon 应为 null");
    }

    /**
     * 测试无 Info.plist 时抛异常
     */
    @Test
    void testParseWithNoInfoPlist() throws Exception {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(bos)) {
            zos.putNextEntry(new ZipEntry("Payload/App.app/somefile.txt"));
            zos.write("hello".getBytes());
            zos.closeEntry();
        }

        MockMultipartFile file = new MockMultipartFile("file", "bad.ipa", "application/octet-stream", bos.toByteArray());

        assertThrows(IOException.class, () -> ipaParserComponent.parse(file));
    }

    /**
     * 测试 versionCode 非数字时默认为 0
     */
    @Test
    void testParseWithNonNumericVersionCode() throws Exception {
        byte[] plistData = buildInfoPlist(
                "com.test.app", "1.0.0", "abc", "TestApp", null
        );

        byte[] ipaBytes = buildFakeIpa("TestApp.app", plistData, null);
        MockMultipartFile file = new MockMultipartFile("file", "test.ipa", "application/octet-stream", ipaBytes);

        Map<String, Object> result = ipaParserComponent.parse(file);

        assertEquals(0, result.get("versionCode"), "非数字 versionCode 应默认为 0");
    }
}
