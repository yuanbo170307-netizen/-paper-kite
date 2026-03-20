package com.appspaces.boot.app.version.service.impl;

import com.appspaces.boot.app.version.entity.AppVersionEntity;
import com.appspaces.boot.app.version.model.response.AppVersionResponse;
import com.appspaces.boot.app.version.repository.AppVersionRepository;
import com.appspaces.boot.app.version.service.AppVersionService;
import com.appspaces.commons.exception.BizRuntimeException;
import com.appspaces.storage.service.OssStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 应用版本服务实现
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Service
public class AppVersionServiceImpl implements AppVersionService {

    private static final Logger log = LoggerFactory.getLogger(AppVersionServiceImpl.class);

    @Autowired
    private AppVersionRepository appVersionRepository;

    @Autowired
    private OssStorageService ossStorageService;

    @Override
    public List<AppVersionResponse> listByApp(Long appId) {
        tk.mybatis.mapper.entity.Example example = new tk.mybatis.mapper.entity.Example(AppVersionEntity.class);
        example.createCriteria().andEqualTo("appId", appId);
        example.orderBy("createTime").desc();
        List<AppVersionEntity> entityList = appVersionRepository.selectByExample(example);
        return entityList.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<AppVersionResponse> listByAppPaged(Long appId, int page, int size) {
        tk.mybatis.mapper.entity.Example example = new tk.mybatis.mapper.entity.Example(AppVersionEntity.class);
        example.createCriteria().andEqualTo("appId", appId);
        example.orderBy("createTime").desc();
        List<AppVersionEntity> entityList = appVersionRepository.selectByExample(example);
        int fromIndex = (page - 1) * size;
        if (fromIndex >= entityList.size()) {
            return Collections.emptyList();
        }
        int toIndex = Math.min(fromIndex + size, entityList.size());
        return entityList.subList(fromIndex, toIndex).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AppVersionEntity getById(Long versionId) {
        AppVersionEntity entity = appVersionRepository.selectByPrimaryKey(versionId);
        if (Objects.isNull(entity)) {
            throw new BizRuntimeException("版本不存在");
        }
        return entity;
    }

    @Override
    @Transactional(rollbackFor = Exception.class, isolation = Isolation.READ_COMMITTED)
    public void delete(Long versionId) {
        AppVersionEntity entity = getById(versionId);
        // 删除 OSS 文件
        ossStorageService.delete(entity.getFilePath());
        appVersionRepository.deleteByPrimaryKey(versionId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class, isolation = Isolation.READ_COMMITTED)
    public void incrementDownloadCount(Long versionId) {
        AppVersionEntity entity = getById(versionId);
        entity.setDownloadCount(entity.getDownloadCount() + 1);
        entity.setUpdateTime(new Date());
        appVersionRepository.updateByPrimaryKeySelective(entity);
    }

    /**
     * 实体转响应对象
     *
     * @param entity 版本实体
     * @return 版本响应
     */
    private AppVersionResponse toResponse(AppVersionEntity entity) {
        AppVersionResponse response = new AppVersionResponse();
        BeanUtils.copyProperties(entity, response);
        response.setDownloadUrl(ossStorageService.getUrl(entity.getFilePath()));
        return response;
    }
}
