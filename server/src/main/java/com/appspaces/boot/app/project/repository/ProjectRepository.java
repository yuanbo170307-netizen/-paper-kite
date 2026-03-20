package com.appspaces.boot.app.project.repository;

import com.appspaces.boot.app.project.entity.ProjectEntity;
import com.appspaces.commons.repository.AbstractRepository;
import org.springframework.stereotype.Repository;

/**
 * 项目数据访问
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Repository
public interface ProjectRepository extends AbstractRepository<ProjectEntity> {
}
