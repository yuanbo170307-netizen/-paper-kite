package com.appspaces.boot.app.app.model.request;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;

/**
 * 设置当前版本请求
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Getter
@Setter
public class SetCurrentVersionRequest {

    @NotNull(message = "版本 ID 不能为空")
    private Long versionId;
}
