package com.appspaces.boot.app.app.component;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * 二维码生成组件
 *
 * @author liyuanbo
 * @create 2026/03/17
 */
@Component
public class QrCodeComponent {

    private static final int DEFAULT_SIZE = 300;

    /**
     * 生成二维码图片字节数组
     *
     * @param content 二维码内容（URL）
     * @return PNG 图片字节数组
     * @throws WriterException 编码异常
     * @throws IOException     输出异常
     */
    public byte[] generate(String content) throws WriterException, IOException {
        return generate(content, DEFAULT_SIZE);
    }

    /**
     * 生成指定尺寸的二维码图片
     *
     * @param content 二维码内容
     * @param size    图片尺寸（像素）
     * @return PNG 图片字节数组
     * @throws WriterException 编码异常
     * @throws IOException     输出异常
     */
    public byte[] generate(String content, int size) throws WriterException, IOException {
        Map<EncodeHintType, Object> hints = new HashMap<>(4);
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, 1);

        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, size, size, hints);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(matrix, "PNG", outputStream);
        return outputStream.toByteArray();
    }
}
