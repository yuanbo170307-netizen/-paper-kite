package com.appspaces.boot.app.app.model.request;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;

/**
 * 验证访问密码请求
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Getter
@Setter
public class VerifyPasswordRequest {

    @NotBlank(message = "password is required")
    private String password;
}
