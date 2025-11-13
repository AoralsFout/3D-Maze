import MathVector from "./MathVector.js";

class CameraController {
    constructor(renderer) {
        this.renderer = renderer;
        this.camera = renderer.camera;

        // 相机控制参数
        this.movementSpeed = 0.2;
        this.mouseSensitivity = 0.002;

        // 控制状态
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            isDown: false
        };

        // 相机限制
        this.minFocus = 1;
        this.maxFocus = 1000;
        this.boundary = {
            minX: -1000,
            maxX: 1000,
            minY: -1000,
            maxY: 1000,
            minZ: -1000,
            maxZ: 1000
        };

        // 初始化事件监听
        this.initEventListeners();
    }

    /**
     * 初始化事件监听器
     */
    initEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // 鼠标事件
        const canvas = this.renderer.canvas;
        canvas.addEventListener('mousedown', (e) => {
            this.mouse.isDown = true;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (this.mouse.isDown) {
                this.handleMouseMove(e.clientX, e.clientY);
            }
        });

        canvas.addEventListener('mouseup', () => {
            this.mouse.isDown = false;
        });

        canvas.addEventListener('mouseleave', () => {
            this.mouse.isDown = false;
        });

        // 鼠标滚轮事件（缩放）
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleMouseWheel(e.deltaY);
        });

        // 防止默认行为
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * 处理鼠标移动
     */
    handleMouseMove(newX, newY) {
        const deltaX = newX - this.mouse.x;
        const deltaY = newY - this.mouse.y;

        this.rotateCamera(deltaX * this.mouseSensitivity, deltaY * this.mouseSensitivity);

        this.mouse.x = newX;
        this.mouse.y = newY;
    }

    /**
     * 处理鼠标滚轮（缩放）
     */
    handleMouseWheel(deltaY) {
        const zoomFactor = 1.1;
        if (deltaY > 0) {
            // 缩小
            this.camera.focus = Math.min(this.maxFocus, this.camera.focus * zoomFactor);
        } else {
            // 放大
            this.camera.focus = Math.max(this.minFocus, this.camera.focus / zoomFactor);
        }
    }

    /**
     * 旋转相机
     */
    rotateCamera(deltaX, deltaY) {
        // 获取当前方向向量
        const direction = this.camera.direction;

        // 计算旋转轴（垂直于当前方向和上向量）
        const up = [0, 0, 1]; // 假设Y轴为上方向
        const right = MathVector.getCrossVector(direction, up);

        // 水平旋转（绕Y轴）
        const horizontalRotation = this.rotateVector(direction, up, deltaX);

        // 垂直旋转（绕右轴）
        const verticalRotation = this.rotateVector(horizontalRotation, right, deltaY);

        // 限制垂直旋转角度（避免翻转）
        const dotProduct = MathVector.dotProduct(verticalRotation, up);
        if (Math.abs(dotProduct) < 0.95) { // 限制在±20度以内
            this.camera.direction = MathVector.normalize(verticalRotation);
        } else {
            this.camera.direction = MathVector.normalize(horizontalRotation);
        }
    }

    /**
     * 旋转向量
     */
    rotateVector(vector, axis, angle) {
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);

        const dot = MathVector.dotProduct(vector, axis);
        const cross = MathVector.getCrossVector(axis, vector);

        const rotated = [
            vector[0] * cosAngle + cross[0] * sinAngle + axis[0] * dot * (1 - cosAngle),
            vector[1] * cosAngle + cross[1] * sinAngle + axis[1] * dot * (1 - cosAngle),
            vector[2] * cosAngle + cross[2] * sinAngle + axis[2] * dot * (1 - cosAngle)
        ];

        return rotated;
    }

    /**
     * 移动相机
     */
    moveCamera(forward, right, up) {
        const direction = this.camera.direction;
        const currentUp = [0, 0, 1]; // 假设Y轴为上方向
        const currentRight = MathVector.getCrossVector(direction, currentUp);

        // 计算移动向量d
        const moveVector = [
            direction[0] * forward + currentRight[0] * right + currentUp[0] * up,
            direction[1] * forward + currentRight[1] * right + currentUp[1] * up,
            direction[2] * forward + currentRight[2] * right + currentUp[2] * up
        ];

        // const moveVector = [
        //     direction[0] * forward + currentRight[0] * right,
        //     direction[1] * forward + currentRight[1] * right,
        //     0
        // ];

        // 应用移动速度
        const normalizedMove = MathVector.normalize(moveVector);
        const movement = [
            normalizedMove[0] * this.movementSpeed,
            normalizedMove[1] * this.movementSpeed,
            normalizedMove[2] * this.movementSpeed
        ];

        // 更新相机位置
        this.camera.position[0] += movement[0];
        this.camera.position[1] += movement[1];
        this.camera.position[2] += movement[2];

        // 应用边界限制
        this.applyBoundaryConstraints();
    }

    /**
     * 应用边界约束
     */
    applyBoundaryConstraints() {
        this.camera.position[0] = Math.max(this.boundary.minX,
            Math.min(this.boundary.maxX, this.camera.position[0]));
        this.camera.position[1] = Math.max(this.boundary.minY,
            Math.min(this.boundary.maxY, this.camera.position[1]));
        this.camera.position[2] = Math.max(this.boundary.minZ,
            Math.min(this.boundary.maxZ, this.camera.position[2]));
    }

    /**
     * 处理键盘输入
     */
    handleKeyboardInput() {
        let forward = 0;
        let right = 0;
        let up = 0;

        // WASD 控制移动
        if (this.keys['w'] || this.keys['arrowup']) {
            forward = 1;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            forward = -1;
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            right = -1;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            right = 1;
        }

        // QE 控制垂直移动
        if (this.keys['q']) {
            up = -1;
        }
        if (this.keys['e']) {
            up = 1;
        }

        // 空格键重置相机
        if (this.keys[' ']) {
            this.resetCamera();
        }

        // 如果有移动输入，则移动相机
        if (forward !== 0 || right !== 0 || up !== 0) {
            this.moveCamera(forward, right, up);
        }
    }

    /**
     * 重置相机到初始位置
     */
    resetCamera() {
        this.camera.position = [500, 500, 500];
        this.camera.direction = [-1, -1, -1];
        this.camera.focus = 100;
    }

    /**
     * 设置移动速度
     */
    setMovementSpeed(speed) {
        this.movementSpeed = Math.max(0.1, speed);
    }

    /**
     * 设置边界限制
     */
    setBoundary(minX, maxX, minY, maxY, minZ, maxZ) {
        this.boundary = {
            minX, maxX, minY, maxY, minZ, maxZ
        };
    }

    /**
     * 获取相机信息
     */
    getCameraInfo() {
        return {
            position: [...this.camera.position],
            direction: [...this.camera.direction],
            focus: this.camera.focus,
            fov: this.camera.fov
        };
    }

    /**
     * 更新相机控制器（每帧调用）
     */
    update() {
        this.handleKeyboardInput();
        this.renderer.render();
    }
}

export default CameraController;