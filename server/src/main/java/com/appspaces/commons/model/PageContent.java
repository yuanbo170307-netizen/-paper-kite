package com.appspaces.commons.model;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 分页结果
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Getter
@Setter
public class PageContent<T> {

    private List<T> list;
    private long total;
    private int page;
    private int rows;

    public PageContent() {
    }

    public PageContent(List<T> list, long total, int page, int rows) {
        this.list = list;
        this.total = total;
        this.page = page;
        this.rows = rows;
    }
}
