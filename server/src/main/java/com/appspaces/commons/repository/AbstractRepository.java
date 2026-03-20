package com.appspaces.commons.repository;

import tk.mybatis.mapper.common.Mapper;
import tk.mybatis.mapper.common.MySqlMapper;

/**
 * 基类 Repository，继承 tk.mybatis 通用 Mapper
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
public interface AbstractRepository<T> extends Mapper<T>, MySqlMapper<T> {
}
