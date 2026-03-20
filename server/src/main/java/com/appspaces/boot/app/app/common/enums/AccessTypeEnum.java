package com.appspaces.boot.app.app.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 访问类型枚举
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Getter
@AllArgsConstructor
public enum AccessTypeEnum {

    PUBLIC(1, "公开"),
    PASSWORD(2, "密码保护");

    private final int code;
    private final String desc;

    /**
     * 校验访问类型是否合法
     *
     * @param code 访问类型编码
     * @return 是否合法
     */
    public static boolean checkAccessType(Integer code) {
        if (code == null) {
            return false;
        }
        for (AccessTypeEnum value : values()) {
            if (value.getCode() == code) {
                return true;
            }
        }
        return false;
    }
}
