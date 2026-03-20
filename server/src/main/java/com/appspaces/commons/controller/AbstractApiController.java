package com.appspaces.commons.controller;

import com.appspaces.commons.model.ApiResponse;

/**
 * 基类 Controller，提供统一响应方法
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
public abstract class AbstractApiController {

    /**
     * 构建成功响应
     *
     * @param data 响应数据
     * @param <T>  数据类型
     * @return ApiResponse
     */
    protected <T> ApiResponse<T> setContext(T data) {
        return ApiResponse.success(data);
    }

    /**
     * 构建成功响应（无数据）
     *
     * @return ApiResponse
     */
    protected ApiResponse<Void> setContext() {
        return ApiResponse.success();
    }
}
