package com.appspaces.boot.app.app.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 平台枚举
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Getter
@AllArgsConstructor
public enum PlatformEnum {

    IOS(1, "iOS"),
    ANDROID(2, "Android");

    private final int code;
    private final String desc;

    /**
     * 校验平台值是否合法
     *
     * @param code 平台编码
     * @return 是否合法
     */
    public static boolean checkPlatform(Integer code) {
        if (code == null) {
            return false;
        }
        for (PlatformEnum value : values()) {
            if (value.getCode() == code) {
                return true;
            }
        }
        return false;
    }
}
