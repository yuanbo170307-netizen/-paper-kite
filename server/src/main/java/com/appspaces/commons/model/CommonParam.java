package com.appspaces.commons.model;

import lombok.Getter;
import lombok.Setter;

/**
 * 分页查询基类
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Getter
@Setter
public class CommonParam {

    private Integer page = 1;
    private Integer rows = 20;

    /**
     * 计算偏移量
     *
     * @return offset
     */
    public int getOffset() {
        return (page - 1) * rows;
    }
}
