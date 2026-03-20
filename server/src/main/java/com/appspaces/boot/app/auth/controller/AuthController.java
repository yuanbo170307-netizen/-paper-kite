package com.appspaces.boot.app.auth.controller;

import com.appspaces.boot.app.auth.config.JwtUtil;
import com.appspaces.boot.app.auth.model.LoginRequest;
import com.appspaces.boot.app.auth.model.LoginResponse;
import com.appspaces.commons.controller.AbstractApiController;
import com.appspaces.commons.exception.BizRuntimeException;
import com.appspaces.commons.model.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 登录接口
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController extends AbstractApiController {

    @Value("${appspaces.admin.username:admin}")
    private String adminUsername;

    @Value("${appspaces.admin.password}")
    private String adminPassword;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * 登录
     *
     * @param request 登录请求
     * @return token
     */
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Validated @RequestBody LoginRequest request) {
        if (!adminUsername.equals(request.getUsername())
                || !adminPassword.equals(request.getPassword())) {
            throw new BizRuntimeException(401, "用户名或密码错误");
        }
        String token = jwtUtil.generateToken(request.getUsername());
        return setContext(new LoginResponse(token, request.getUsername()));
    }
}
