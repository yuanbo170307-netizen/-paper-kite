package com.appspaces.boot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import tk.mybatis.spring.annotation.MapperScan;

/**
 * Appspaces 应用启动类
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@SpringBootApplication(scanBasePackages = {"com.appspaces"})
@MapperScan(basePackages = "com.appspaces.boot.app.**.repository",
        markerInterface = com.appspaces.commons.repository.AbstractRepository.class)
@EnableScheduling
public class AppBizApplication {

    public static void main(String[] args) {
        SpringApplication.run(AppBizApplication.class, args);
    }
}
