package com.appspaces.boot.app.project.service.impl;

import com.appspaces.boot.app.project.entity.ProjectEntity;
import com.appspaces.boot.app.project.model.request.CreateProjectRequest;
import com.appspaces.boot.app.project.model.request.UpdateProjectRequest;
import com.appspaces.boot.app.project.model.response.ProjectResponse;
import com.appspaces.boot.app.project.repository.ProjectRepository;
import com.appspaces.boot.app.project.service.ProjectService;
import com.appspaces.commons.exception.BizRuntimeException;
import com.appspaces.storage.service.OssStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.Assert;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 项目服务实现
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Service
public class ProjectServiceImpl implements ProjectService {

    private static final Logger log = LoggerFactory.getLogger(ProjectServiceImpl.class);

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private OssStorageService ossStorageService;

    @Override
    @Transactional(rollbackFor = Exception.class, isolation = Isolation.READ_COMMITTED)
    public ProjectResponse create(CreateProjectRequest request) {
        // 校验 projectKey 唯一
        ProjectEntity query = new ProjectEntity();
        query.setProjectKey(request.getProjectKey());
        ProjectEntity existing = projectRepository.selectOne(query);
        Assert.isTrue(Objects.isNull(existing), "项目标识已存在");

        ProjectEntity entity = new ProjectEntity();
        entity.setProjectKey(request.getProjectKey());
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setCreateTime(new Date());
        entity.setUpdateTime(new Date());
        projectRepository.insertSelective(entity);

        return toResponse(entity);
    }

    @Override
    public List<ProjectResponse> list() {
        List<ProjectEntity> entityList = projectRepository.selectAll();
        return entityList.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class, isolation = Isolation.READ_COMMITTED)
    public ProjectResponse update(Long projectId, UpdateProjectRequest request) {
        ProjectEntity entity = getById(projectId);
        if (Objects.nonNull(request.getName())) {
            entity.setName(request.getName());
        }
        if (Objects.nonNull(request.getDescription())) {
            entity.setDescription(request.getDescription());
        }
        entity.setUpdateTime(new Date());
        projectRepository.updateByPrimaryKeySelective(entity);

        return toResponse(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class, isolation = Isolation.READ_COMMITTED)
    public ProjectResponse uploadIcon(Long projectId, MultipartFile file) {
        ProjectEntity entity = getById(projectId);
        String iconKey = "appspaces/project/" + entity.getProjectKey() + "/icon.png";
        try {
            ossStorageService.upload(iconKey, file.getInputStream());
        } catch (IOException e) {
            log.error("ProjectServiceImpl#uploadIcon 上传图标失败，projectId={}", projectId, e);
            throw new BizRuntimeException("图标上传失败");
        }
        entity.setIconPath(iconKey);
        entity.setUpdateTime(new Date());
        projectRepository.updateByPrimaryKeySelective(entity);
        return toResponse(entity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class, isolation = Isolation.READ_COMMITTED)
    public void delete(Long projectId) {
        ProjectEntity entity = getById(projectId);
        projectRepository.delete(entity);
    }

    @Override
    public ProjectEntity getById(Long projectId) {
        ProjectEntity entity = projectRepository.selectByPrimaryKey(projectId);
        if (Objects.isNull(entity)) {
            throw new BizRuntimeException("项目不存在");
        }
        return entity;
    }

    @Override
    public ProjectEntity getByProjectKey(String projectKey) {
        ProjectEntity query = new ProjectEntity();
        query.setProjectKey(projectKey);
        ProjectEntity entity = projectRepository.selectOne(query);
        if (Objects.isNull(entity)) {
            throw new BizRuntimeException("project not found: " + projectKey);
        }
        return entity;
    }

    /**
     * 实体转响应对象
     *
     * @param entity 项目实体
     * @return 项目响应
     */
    private ProjectResponse toResponse(ProjectEntity entity) {
        ProjectResponse response = new ProjectResponse();
        BeanUtils.copyProperties(entity, response);
        if (StringUtils.hasText(entity.getIconPath())) {
            response.setIconUrl(ossStorageService.getUrl(entity.getIconPath()));
        }
        return response;
    }
}
