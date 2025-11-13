/**
 * 渲染器
 * 根据模型数据渲染画面
 * data: 模型数据
 *  {
 *      v:[[x0,y0,z0],[x1,y1,z1],...]
 *      f:[[vindex0,vindex1,vindex2,rgb0],[vindex3,vindex4,vindex5,rgb1],...]
 *  }
 * 
 *  camera: 相机数据
 *  {
 *      position: [x,y,z],      相机位置
 *      direction: [vx,vy,vz],  相机方向
 *      focus: f,               相机焦距
 *      fov: fov,               相机视野角度
 *  }
*/
import MathVector from "./MathVector.js";

class Renderer {
    constructor(data, camera, axis = false, lineMode = false) {
        this.canvas = document.getElementById("screen");
        this.context = this.canvas.getContext("2d");
        this.data = data;
        this.camera = camera;
        this.imageBuffer = this.context.createImageData(this.canvas.width, this.canvas.height);
        this.depthBuffer = new Float32Array(this.canvas.width * this.canvas.height);
        this.colorCache = new Map();
        this.defaultColor = "#888888";
        this.defaultColorRGB = this.parseColor(this.defaultColor);
        this.resetBuffers();
        this.lineMode = lineMode;
        this.axis = axis;
        this.renderDistance = 50;
    }

    /**
     * 重置缓冲器
     */
    resetBuffers() {
        // 重置深度缓冲
        this.depthBuffer.fill(Infinity);

        // 重置图像缓冲为黑色
        const data = this.imageBuffer.data;
        data.fill(0);
        for (let i = 3; i < data.length; i += 4) {
            data[i] = 255; // A
        }
    }

    getDotReflection(dot, focus) {
        return [focus * dot[0] / (focus + dot[2]), focus * dot[1] / (focus + dot[2])];
    }

    fovlize(reflectedDot) {
        const fovWidth = 2 * this.camera.focus * Math.tan(this.camera.fov / 2);
        const fovHeight = fovWidth * this.canvas.height / this.canvas.width;
        return [reflectedDot[0] * this.canvas.width / fovWidth,
        reflectedDot[1] * this.canvas.height / fovHeight];
    }

    /**
     * 快速三角形填充
     */
    fillTriangleFast(v0, v1, v2, depths, rgb) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const depthBuffer = this.depthBuffer;
        const buffer = this.imageBuffer.data;

        // 计算边界框
        const minX = Math.max(0, Math.min(v0[0], v1[0], v2[0]));
        const maxX = Math.min(width - 1, Math.max(v0[0], v1[0], v2[0]));
        const minY = Math.max(0, Math.min(v0[1], v1[1], v2[1]));
        const maxY = Math.min(height - 1, Math.max(v0[1], v1[1], v2[1]));

        if (minX > maxX || minY > maxY) return;

        // 计算三角形面积（用于重心坐标归一化）
        const area = (v1[0] - v0[0]) * (v2[1] - v0[1]) - (v2[0] - v0[0]) * (v1[1] - v0[1]);
        if (Math.abs(area) < 0.0001) return;
        const invArea = 1 / area;

        // 遍历边界框
        for (let y = minY; y <= maxY; y++) {
            const rowIndex = y * width;
            for (let x = minX; x <= maxX; x++) {
                // 计算重心坐标（使用边方程）
                const w0 = (v1[0] - x) * (v2[1] - y) - (v2[0] - x) * (v1[1] - y);
                const w1 = (v2[0] - x) * (v0[1] - y) - (v0[0] - x) * (v2[1] - y);
                const w2 = (v0[0] - x) * (v1[1] - y) - (v1[0] - x) * (v0[1] - y);

                // 检查点是否在三角形内（所有重心坐标同号）
                if ((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0)) {
                    // 归一化重心坐标
                    const alpha = w0 * invArea;
                    const beta = w1 * invArea;
                    const gamma = w2 * invArea;

                    // 深度插值
                    const depth = alpha * depths[0] + beta * depths[1] + gamma * depths[2];

                    // 深度测试
                    const index = rowIndex + x;
                    if (depth < depthBuffer[index]) {
                        depthBuffer[index] = depth;

                        // 根据深度调整颜色亮度
                        const adjustedRgb = this.adjustColorByDepth(rgb, depth);

                        // 设置像素颜色
                        const pixelIndex = index << 2;
                        buffer[pixelIndex] = adjustedRgb[0];     // R
                        buffer[pixelIndex + 1] = adjustedRgb[1]; // G
                        buffer[pixelIndex + 2] = adjustedRgb[2]; // B
                        buffer[pixelIndex + 3] = 255;           // A
                    }
                }
            }
        }
    }

    /**
     * 边方程计算
     */
    edgeEquation(v1, v2) {
        const dx = v2[0] - v1[0];
        const dy = v2[1] - v1[1];
        return (x, y) => {
            return dx * (y - v1[1]) - dy * (x - v1[0]);
        };
    }

    /**
     * 解析颜色字符串
     */
    parseColor(color) {
        if (color.startsWith('#')) {
            const hex = color.substring(1);
            if (hex.length === 3) {
                return [
                    parseInt(hex[0] + hex[0], 16),
                    parseInt(hex[1] + hex[1], 16),
                    parseInt(hex[2] + hex[2], 16)
                ];
            } else if (hex.length === 6) {
                return [
                    parseInt(hex.substring(0, 2), 16),
                    parseInt(hex.substring(2, 4), 16),
                    parseInt(hex.substring(4, 6), 16)
                ];
            }
        }
        return [136, 136, 136];
    }

    getColorRGB(color) {
        if (!color) {
            return this.defaultColorRGB;
        }
        if (!this.colorCache.has(color)) {
            this.colorCache.set(color, this.parseColor(color));
        }
        return this.colorCache.get(color);
    }

    /**
     * 根据深度调整颜色亮度
     * @param {number[]} rgb - 原始RGB颜色数组
     * @param {number} depth - 当前像素的深度值
     * @param {number} maxDepth - 最大可见深度（用于归一化）
     * @returns {number[]} 调整后的RGB颜色数
     */
    adjustColorByDepth(rgb, depth, maxDepth = 50) {
        // 计算深度因子：距离越远，亮度越低
        // 使用指数衰减函数，让远处的物体更快变暗
        const depthFactor = Math.exp(-depth / maxDepth);

        // 调整RGB值
        return [
            Math.min(255, Math.max(0, Math.round(rgb[0] * depthFactor))),
            Math.min(255, Math.max(0, Math.round(rgb[1] * depthFactor))),
            Math.min(255, Math.max(0, Math.round(rgb[2] * depthFactor)))
        ];
    }

    /**
     * 绘制坐标轴
     */
    drawAxes() {
        const Z = this.camera.direction;
        const tX = MathVector.get2DVerticalVector([Z[0], Z[1]]);
        const X = [-tX[0], -tX[1], 0];
        const Y = MathVector.getCrossVector(X, Z);
        const origin = this.camera.position;
        const focus = this.camera.focus;

        const axes = [
            { start: [0, 0, 0], end: [5, 0, 0], color: "#FF0000", label: "X" }, // X轴 - 红色
            { start: [0, 0, 0], end: [0, 5, 0], color: "#00FF00", label: "Y" }, // Y轴 - 绿色
            { start: [0, 0, 0], end: [0, 0, 5], color: "#0000FF", label: "Z" }  // Z轴 - 蓝色
        ];

        // 绘制坐标轴线
        this.context.lineWidth = 2;

        for (const axis of axes) {
            const startReflected = MathVector.reflectDotToNewAxis(axis.start, origin, X, Y, Z);
            const endReflected = MathVector.reflectDotToNewAxis(axis.end, origin, X, Y, Z);

            // 检查是否在相机前方
            if (startReflected[2] <= 0 || endReflected[2] <= 0) {
                continue;
            }

            const startFovlized = this.fovlize(this.getDotReflection(startReflected, focus));
            const endFovlized = this.fovlize(this.getDotReflection(endReflected, focus));

            const startScreen = [
                startFovlized[0] + this.canvas.width / 2,
                this.canvas.height / 2 - startFovlized[1]
            ];
            const endScreen = [
                endFovlized[0] + this.canvas.width / 2,
                this.canvas.height / 2 - endFovlized[1]
            ];

            // 绘制轴线
            this.context.strokeStyle = axis.color;
            this.context.beginPath();
            this.context.moveTo(startScreen[0], startScreen[1]);
            this.context.lineTo(endScreen[0], endScreen[1]);
            this.context.stroke();

            // 绘制轴标签
            this.context.fillStyle = axis.color;
            this.context.font = "12px Arial";
            this.context.fillText(axis.label, endScreen[0] + 5, endScreen[1] + 5);
        }

        // 绘制原点标记
        const originReflected = MathVector.reflectDotToNewAxis([0, 0, 0], origin, X, Y, Z);
        if (originReflected[2] > 0) {
            const originFovlized = this.fovlize(this.getDotReflection(originReflected, focus));
            const originScreen = [
                originFovlized[0] + this.canvas.width / 2,
                this.canvas.height / 2 - originFovlized[1]
            ];

            this.context.fillStyle = "#FFFFFF";
            this.context.beginPath();
            this.context.arc(originScreen[0], originScreen[1], 3, 0, 2 * Math.PI);
            this.context.fill();
            this.context.fillText("O", originScreen[0] + 5, originScreen[1] + 5);
        }
    }

    render() {
        this.resetBuffers();

        const Z = this.camera.direction;
        const tX = MathVector.get2DVerticalVector([Z[0], Z[1]]);
        const X = [-tX[0], -tX[1], 0];
        const Y = MathVector.getCrossVector(X, Z);
        const origin = this.camera.position;
        const focus = this.camera.focus;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const trianglesForStroke = this.lineMode ? [] : null;

        for (let i = 0; i < this.data.f.length; i++) {
            const face = this.data.f[i];
            const dot0 = this.data.v[face[0]];
            const dot1 = this.data.v[face[1]];
            const dot2 = this.data.v[face[2]];

            const reflectedDot0 = MathVector.reflectDotToNewAxis(dot0, origin, X, Y, Z);
            const reflectedDot1 = MathVector.reflectDotToNewAxis(dot1, origin, X, Y, Z);
            const reflectedDot2 = MathVector.reflectDotToNewAxis(dot2, origin, X, Y, Z);

            // 检查三角形是否在相机前方
            if (reflectedDot0[2] <= 0 || reflectedDot1[2] <= 0 || reflectedDot2[2] <= 0) {
                continue;
            }

            if (reflectedDot0[2] >= this.renderDistance && reflectedDot1[2] >= this.renderDistance && reflectedDot2[2] >= this.renderDistance) {
                continue;
            }

            const fovlizedDot0 = this.fovlize(this.getDotReflection(reflectedDot0, focus));
            const fovlizedDot1 = this.fovlize(this.getDotReflection(reflectedDot1, focus));
            const fovlizedDot2 = this.fovlize(this.getDotReflection(reflectedDot2, focus));

            const screenDot0 = [
                Math.round(fovlizedDot0[0] + halfWidth),
                Math.round(halfHeight - fovlizedDot0[1])
            ];
            const screenDot1 = [
                Math.round(fovlizedDot1[0] + halfWidth),
                Math.round(halfHeight - fovlizedDot1[1])
            ];
            const screenDot2 = [
                Math.round(fovlizedDot2[0] + halfWidth),
                Math.round(halfHeight - fovlizedDot2[1])
            ];

            // 快速三角形填充
            this.fillTriangleFast(
                screenDot0, screenDot1, screenDot2,
                [reflectedDot0[2], reflectedDot1[2], reflectedDot2[2]],
                this.getColorRGB(face[3])
            );

            if (trianglesForStroke) {
                trianglesForStroke.push([
                    [fovlizedDot0[0] + halfWidth, halfHeight - fovlizedDot0[1]],
                    [fovlizedDot1[0] + halfWidth, halfHeight - fovlizedDot1[1]],
                    [fovlizedDot2[0] + halfWidth, halfHeight - fovlizedDot2[1]]
                ]);
            }
        }

        // 一次性绘制所有像素
        this.context.putImageData(this.imageBuffer, 0, 0);

        if (this.axis) {
            this.drawAxes();
        }

        if (this.lineMode) {
            // 描边
            this.context.strokeStyle = "#333333";
            this.context.lineWidth = 0.5;
            // this.context.lineJoin = "round";

            for (const triangle of trianglesForStroke || []) {
                this.context.beginPath();
                this.context.moveTo(triangle[0][0], triangle[0][1]);
                this.context.lineTo(triangle[1][0], triangle[1][1]);
                this.context.lineTo(triangle[2][0], triangle[2][1]);
                this.context.closePath();
                this.context.stroke();
            }
        }
    }
}

export default Renderer;