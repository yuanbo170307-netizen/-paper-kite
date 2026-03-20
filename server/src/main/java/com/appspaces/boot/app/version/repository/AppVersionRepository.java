package com.appspaces.boot.app.version.repository;

import com.appspaces.boot.app.version.entity.AppVersionEntity;
import com.appspaces.commons.repository.AbstractRepository;
import org.springframework.stereotype.Repository;

/**
 * 应用版本数据访问
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Repository
public interface AppVersionRepository extends AbstractRepository<AppVersionEntity> {
}
