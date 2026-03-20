package com.appspaces.boot.app.auth.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 登录响应
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Getter
@Setter
public class LoginResponse {

    private String token;
    private String username;

    public LoginResponse(String token, String username) {
        this.token = token;
        this.username = username;
    }
}
