package com.appspaces.boot.app.app.repository;

import com.appspaces.boot.app.app.entity.AppEntity;
import com.appspaces.commons.repository.AbstractRepository;
import org.springframework.stereotype.Repository;

/**
 * 应用数据访问
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Repository
public interface AppRepository extends AbstractRepository<AppEntity> {
}
