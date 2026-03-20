package com.appspaces.common.utils;

import java.io.*;
import java.util.zip.CRC32;
import java.util.zip.DataFormatException;
import java.util.zip.Deflater;
import java.util.zip.Inflater;

/**
 * iOS CgBI PNG 转标准 PNG 工具
 * <p>
 * iOS IPA 中的图标是苹果私有格式（CgBI PNG），与标准 PNG 的差异：
 * 1. 文件头多一个 CgBI chunk
 * 2. 像素通道顺序是 BGRA（非标准 RGBA）
 * 3. Alpha 通道是预乘（premultiplied）
 * 4. IDAT 压缩使用 raw deflate（无 zlib 头），标准 PNG 使用 zlib
 * <p>
 * 转换步骤：去掉 CgBI chunk、交换 B/R 通道、反预乘 Alpha、重新用 zlib 压缩
 *
 * @author liyuanbo
 * @create 2026/03/18
 */
public class IphonePngUtils {

    private static final byte[] PNG_SIGNATURE = {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    };

    /**
     * 判断是否是 CgBI PNG（苹果私有格式）
     *
     * @param data PNG 文件字节
     * @return 是否为 CgBI PNG
     */
    public static boolean isCgBiPng(byte[] data) {
        if (data == null || data.length < 16) {
            return false;
        }
        return data[12] == 'C' && data[13] == 'g' && data[14] == 'B' && data[15] == 'I';
    }

    /**
     * 将 CgBI PNG 转换为标准 PNG
     * <p>
     * 如果不是 CgBI 格式，原样返回
     *
     * @param input 原始 PNG 字节
     * @return 标准 PNG 字节
     * @throws IOException 转换失败
     */
    public static byte[] normalize(byte[] input) throws IOException {
        if (!isCgBiPng(input)) {
            return input;
        }

        DataInputStream in = new DataInputStream(new ByteArrayInputStream(input));
        ByteArrayOutputStream outBytes = new ByteArrayOutputStream();
        DataOutputStream out = new DataOutputStream(outBytes);

        // 跳过 PNG 文件头（8 字节）
        in.skipBytes(8);
        // 写入标准 PNG 文件头
        out.write(PNG_SIGNATURE);

        int width = 0;
        int height = 0;
        ByteArrayOutputStream idatBuffer = new ByteArrayOutputStream();

        while (in.available() > 0) {
            int length = in.readInt();
            byte[] typeBytes = new byte[4];
            in.readFully(typeBytes);
            String type = new String(typeBytes);
            byte[] data = new byte[length];
            in.readFully(data);
            // 跳过原 CRC（重新计算）
            in.readInt();

            if ("CgBI".equals(type)) {
                // 去掉 CgBI chunk
                continue;
            } else if ("IHDR".equals(type)) {
                width = readInt(data, 0);
                height = readInt(data, 4);
                writeChunk(out, type, data);
            } else if ("IDAT".equals(type)) {
                // 先收集所有 IDAT 数据，最后一起处理
                idatBuffer.write(data);
            } else if ("IEND".equals(type)) {
                // 处理图像数据
                byte[] rawPixels = inflateRaw(idatBuffer.toByteArray());
                swapBgraToRgba(rawPixels, width, height);
                byte[] recompressed = deflateZlib(rawPixels);
                writeChunk(out, "IDAT", recompressed);
                writeChunk(out, "IEND", new byte[0]);
            } else {
                writeChunk(out, type, data);
            }
        }

        return outBytes.toByteArray();
    }

    /**
     * 使用 raw deflate 解压（CgBI PNG 不带 zlib 头）
     */
    private static byte[] inflateRaw(byte[] data) throws IOException {
        Inflater inflater = new Inflater(true);
        inflater.setInput(data);
        ByteArrayOutputStream bos = new ByteArrayOutputStream(data.length * 3);
        byte[] buf = new byte[8192];
        try {
            int count;
            while (!inflater.finished()) {
                count = inflater.inflate(buf);
                bos.write(buf, 0, count);
            }
        } catch (DataFormatException e) {
            throw new IOException("CgBI IDAT 解压失败", e);
        } finally {
            inflater.end();
        }
        return bos.toByteArray();
    }

    /**
     * 将 BGRA 像素数据转换为 RGBA，同时反预乘 Alpha
     * <p>
     * PNG 像素数据格式：每行开头 1 个 filter 字节 + width*4 字节像素
     */
    private static void swapBgraToRgba(byte[] data, int width, int height) {
        int rowSize = 1 + width * 4;
        for (int y = 0; y < height; y++) {
            int rowOffset = y * rowSize + 1;
            for (int x = 0; x < width; x++) {
                int i = rowOffset + x * 4;
                int b = data[i] & 0xFF;
                int g = data[i + 1] & 0xFF;
                int r = data[i + 2] & 0xFF;
                int a = data[i + 3] & 0xFF;
                // 反预乘 Alpha，交换 B/R
                if (a > 0) {
                    data[i] = (byte) Math.min(255, r * 255 / a);
                    data[i + 1] = (byte) Math.min(255, g * 255 / a);
                    data[i + 2] = (byte) Math.min(255, b * 255 / a);
                } else {
                    data[i] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                }
                // Alpha 不变
                data[i + 3] = (byte) a;
            }
        }
    }

    /**
     * 使用 zlib 压缩（标准 PNG 格式）
     */
    private static byte[] deflateZlib(byte[] data) {
        Deflater deflater = new Deflater(Deflater.DEFAULT_COMPRESSION);
        deflater.setInput(data);
        deflater.finish();
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        while (!deflater.finished()) {
            int count = deflater.deflate(buf);
            bos.write(buf, 0, count);
        }
        deflater.end();
        return bos.toByteArray();
    }

    /**
     * 写入 PNG chunk（length + type + data + CRC）
     */
    private static void writeChunk(DataOutputStream out, String type, byte[] data) throws IOException {
        out.writeInt(data.length);
        byte[] typeBytes = type.getBytes();
        out.write(typeBytes);
        out.write(data);
        CRC32 crc32 = new CRC32();
        crc32.update(typeBytes);
        crc32.update(data);
        out.writeInt((int) crc32.getValue());
    }

    /**
     * 从字节数组读取 4 字节大端整数
     */
    private static int readInt(byte[] data, int offset) {
        return ((data[offset] & 0xFF) << 24)
                | ((data[offset + 1] & 0xFF) << 16)
                | ((data[offset + 2] & 0xFF) << 8)
                | (data[offset + 3] & 0xFF);
    }
}
