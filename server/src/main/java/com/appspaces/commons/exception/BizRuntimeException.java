package com.appspaces.commons.exception;

/**
 * 业务运行时异常
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
public class BizRuntimeException extends RuntimeException {

    private int code;

    public BizRuntimeException(String message) {
        super(message);
        this.code = 500;
    }

    public BizRuntimeException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
