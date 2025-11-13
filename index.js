import Renderer from './js/renderer.js';
import CameraController from "./js/cameraController.js";
import OBJDecoder from './js/objDecoder.js';
import MapDecoder from './js/mapDecoder.js';

// 默认的简单模型数据（用于测试）
const defaultData = {
    v: [
        [1, 0, 0],              // 0
        [0, 1, 0],              // 1
        [0, 0, 1],              // 2
        [0, 1, 2],              // 3
        [2, 0, 0],              // 4
        [2, 1, 0],              // 5
        [4, 0, 0],              // 6
        [4, 1, 0],              // 7
        [2, 0, 1],              // 8
        [2, 1, 1],              // 9
        [4, 0, 1],              // 10
        [4, 1, 1],              // 11
        [1, 0, 2],              // 12
        [0, 2, 0],              // 13
        [0, 3, 0],              // 14
        [0.8660, 2.5, 0],       // 15
        [0.2886, 2.5, 0.8165],  // 16
        [-0.5, 1.5, 0.4],       // 17
        [1.5, 1.5, 1.8],        // 18
        [0, -1, 0]                // 19
    ],
    f: [
        [0, 1, 2, '#ff0000'],
        [1, 2, 3, '#ff0000'],
        [4, 5, 6, '#1890ff'],
        [5, 6, 7, '#1890ff'],
        [8, 9, 10, '#1890ff'],
        [9, 10, 11, '#1890ff'],
        [6, 7, 10, '#1890ff'],
        [7, 10, 11, '#1890ff'],
        [7, 5, 11, '#1890ff'],
        [9, 5, 11, '#1890ff'],
        [4, 9, 5, '#1890ff'],
        [4, 8, 9, '#1890ff'],
        [4, 10, 6, '#1890ff'],
        [4, 8, 10, '#1890ff'],
        [12, 2, 0, '#ff0000'],
        [13, 14, 15, '#ff00ff'],
        [14, 15, 16, '#ff00ff'],
        [15, 16, 13, '#ff00ff'],
        [16, 13, 14, '#ff00ff'],
        [17, 18, 19, '#fff000'],
    ],
}

const camera = {
    position: [3, 3, 3],
    direction: [-1, -1, -1],
    focus: 1,
    fov: Math.PI / 4,
}

let renderer;
let cameraController;

/**
 * 初始化渲染器
 * @param {Object} modelData - 模型数据
 */
function initRenderer(modelData) {
    if (renderer) {
        // 如果已有渲染器，先清理
        renderer.cleanup();
    }

    renderer = new Renderer(modelData, camera, true, true);
    renderer.render();

    if (cameraController) {
        cameraController.setRenderer(renderer);
    } else {
        cameraController = new CameraController(renderer);
    }
}

/**
 * 加载并显示OBJ模型
 */
async function loadOBJModel() {
    try {
        // 加载OBJ文件
        console.log('正在加载OBJ模型...');
        const modelData = await OBJDecoder.loadFromFile('./models/map.obj');
        console.log('OBJ模型加载成功，顶点数量:', modelData.v.length, '面数量:', modelData.f.length);

        // 加载地图文件
        console.log('正在加载地图...');
        const mapDecoder = new MapDecoder('./maps/test.map');
        const mapData = await mapDecoder.decodeMap();
        console.log('地图加载成功，顶点数量:', mapData.v.length, '面数量:', mapData.f.length);

        // 初始化渲染器
        // initRenderer(modelData); // 加载OBJ模型
        // initRenderer(mapData); // 加载地图模型
        initRenderer(defaultData); // 加载默认模型

    } catch (error) {
        console.error('加载OBJ模型失败，使用默认模型:', error);
        // 如果加载失败，使用默认模型
        initRenderer(defaultData);
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', async () => {
    // 默认加载OBJ模型
    await loadOBJModel();

    // 游戏循环
    function gameLoop() {
        if (cameraController) {
            cameraController.update();
        }
        requestAnimationFrame(gameLoop);
    }
    gameLoop();
});