package com.appspaces.boot.app.auth.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * JWT 工具类
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Component
public class JwtUtil {

    @Value("${appspaces.jwt.secret:appspaces-secret-key-2026}")
    private String secret;

    @Value("${appspaces.jwt.expire-hours:24}")
    private int expireHours;

    /**
     * 生成 token
     *
     * @param username 用户名
     * @return JWT token
     */
    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expireHours * 3600 * 1000L))
                .signWith(SignatureAlgorithm.HS256, secret)
                .compact();
    }

    /**
     * 解析 token
     *
     * @param token JWT token
     * @return Claims
     */
    public Claims parseToken(String token) {
        return Jwts.parser()
                .setSigningKey(secret)
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * 验证 token 是否有效
     *
     * @param token JWT token
     * @return 是否有效
     */
    public boolean isValid(String token) {
        try {
            Claims claims = parseToken(token);
            return !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}
