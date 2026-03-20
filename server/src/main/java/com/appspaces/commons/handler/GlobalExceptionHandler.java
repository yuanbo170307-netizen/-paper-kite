package com.appspaces.commons.handler;

import com.appspaces.commons.exception.BizRuntimeException;
import com.appspaces.commons.model.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理器
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 业务异常
     *
     * @param e BizRuntimeException
     * @return ApiResponse
     */
    @ExceptionHandler(BizRuntimeException.class)
    public ApiResponse<Void> handleBizException(BizRuntimeException e) {
        log.warn("GlobalExceptionHandler#handleBizException 业务异常，message={}", e.getMessage());
        return ApiResponse.error(e.getCode(), e.getMessage());
    }

    /**
     * Assert 校验异常
     *
     * @param e IllegalArgumentException
     * @return ApiResponse
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ApiResponse<Void> handleIllegalArgumentException(IllegalArgumentException e) {
        log.warn("GlobalExceptionHandler#handleIllegalArgumentException 校验异常，message={}", e.getMessage());
        return ApiResponse.error(400, e.getMessage());
    }

    /**
     * 参数校验异常（@RequestBody）
     *
     * @param e MethodArgumentNotValidException
     * @return ApiResponse
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResponse<Void> handleValidException(MethodArgumentNotValidException e) {
        FieldError fieldError = e.getBindingResult().getFieldError();
        String message = fieldError != null ? fieldError.getDefaultMessage() : "参数校验失败";
        log.warn("GlobalExceptionHandler#handleValidException 参数校验失败，message={}", message);
        return ApiResponse.error(400, message);
    }

    /**
     * 参数绑定异常
     *
     * @param e BindException
     * @return ApiResponse
     */
    @ExceptionHandler(BindException.class)
    public ApiResponse<Void> handleBindException(BindException e) {
        FieldError fieldError = e.getBindingResult().getFieldError();
        String message = fieldError != null ? fieldError.getDefaultMessage() : "参数绑定失败";
        log.warn("GlobalExceptionHandler#handleBindException 参数绑定失败，message={}", message);
        return ApiResponse.error(400, message);
    }

    /**
     * 未知异常
     *
     * @param e Exception
     * @return ApiResponse
     */
    @ExceptionHandler(Exception.class)
    public ApiResponse<Void> handleException(Exception e) {
        log.error("GlobalExceptionHandler#handleException 系统异常", e);
        return ApiResponse.error(500, "系统内部错误");
    }
}
