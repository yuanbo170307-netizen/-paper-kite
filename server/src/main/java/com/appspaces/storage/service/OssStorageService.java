package com.appspaces.storage.service;

import com.aliyun.oss.OSS;
import com.appspaces.storage.config.OssConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.URL;
import java.util.Date;

/**
 * 阿里云 OSS 存储服务
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Service
public class OssStorageService {

    private static final Logger log = LoggerFactory.getLogger(OssStorageService.class);

    /**
     * 签名 URL 有效期：1 小时
     */
    private static final long SIGN_URL_EXPIRE_MS = 3600 * 1000L;

    @Autowired
    private OSS ossClient;

    @Autowired
    private OssConfig ossConfig;

    /**
     * 上传文件到 OSS
     *
     * @param objectKey   OSS 对象路径
     * @param inputStream 文件输入流
     * @return 签名访问 URL
     */
    public String upload(String objectKey, InputStream inputStream) {
        log.info("OssStorageService#upload 上传文件，objectKey={}", objectKey);
        ossClient.putObject(ossConfig.getBucketName(), objectKey, inputStream);
        return getUrl(objectKey);
    }

    /**
     * 获取文件的签名访问 URL（私有 bucket 需要签名才能访问）
     *
     * @param objectKey OSS 对象路径
     * @return 带签名的 HTTPS 访问 URL
     */
    public String getUrl(String objectKey) {
        Date expiration = new Date(System.currentTimeMillis() + SIGN_URL_EXPIRE_MS);
        URL signedUrl = ossClient.generatePresignedUrl(
                ossConfig.getBucketName(), objectKey, expiration);
        return signedUrl.toString();
    }

    /**
     * 获取文件输入流（用于代理下载，绕过 OSS 对 IPA/APK 的直链限制）
     *
     * @param objectKey OSS 对象路径
     * @return 文件输入流
     */
    public InputStream getObject(String objectKey) {
        return ossClient.getObject(ossConfig.getBucketName(), objectKey).getObjectContent();
    }

    /**
     * 获取文件大小
     *
     * @param objectKey OSS 对象路径
     * @return 文件大小（字节）
     */
    public long getObjectSize(String objectKey) {
        return ossClient.getObjectMetadata(ossConfig.getBucketName(), objectKey).getContentLength();
    }

    /**
     * 删除文件
     *
     * @param objectKey OSS 对象路径
     */
    public void delete(String objectKey) {
        log.info("OssStorageService#delete 删除文件，objectKey={}", objectKey);
        ossClient.deleteObject(ossConfig.getBucketName(), objectKey);
    }
}
