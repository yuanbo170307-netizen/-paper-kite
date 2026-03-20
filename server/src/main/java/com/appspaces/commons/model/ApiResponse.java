package com.appspaces.commons.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 统一 API 响应包装
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Getter
@Setter
public class ApiResponse<T> {

    private int code;
    private String message;
    private T data;

    public ApiResponse() {
        this.code = 200;
        this.message = "success";
    }

    public ApiResponse(T data) {
        this();
        this.data = data;
    }

    public ApiResponse(int code, String message) {
        this.code = code;
        this.message = message;
    }

    /**
     * 成功响应
     *
     * @param data 响应数据
     * @param <T>  数据类型
     * @return ApiResponse
     */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(data);
    }

    /**
     * 成功响应（无数据）
     *
     * @return ApiResponse
     */
    public static <T> ApiResponse<T> success() {
        return new ApiResponse<>();
    }

    /**
     * 失败响应
     *
     * @param code    错误码
     * @param message 错误信息
     * @return ApiResponse
     */
    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>(code, message);
    }

    /**
     * 失败响应
     *
     * @param message 错误信息
     * @return ApiResponse
     */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(500, message);
    }
}
