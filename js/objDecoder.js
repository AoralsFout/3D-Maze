/**
 * OBJ文件解码器
 * 将.obj文件解码为3D模型数据
 */

class OBJDecoder {
    /**
     * 解析OBJ文件内容
     * @param {string} objContent - OBJ文件内容
     * @returns {Object} 包含顶点和面数据的对象
     */
    static parse(objContent) {
        const lines = objContent.split('\n');
        const vertices = [];
        const faces = [];

        // 默认颜色数组
        const colors = [
            '#666666',
            '#ff0000','#00ff00', '#0000ff', '#ffff00',
            '#ff00ff', '#00ffff', '#ffa500', '#800080',
            '#008000', '#800000', '#008080', '#808000'
        ];

        for (const line of lines) {
            const trimmedLine = line.trim();

            // 跳过空行和注释
            if (trimmedLine === '' || trimmedLine.startsWith('#')) {
                continue;
            }

            const parts = trimmedLine.split(/\s+/);
            const type = parts[0];

            if (type === 'v') {
                // 解析顶点数据
                if (parts.length >= 4) {
                    const x = parseFloat(parts[1]);
                    const y = parseFloat(parts[2]);
                    const z = parseFloat(parts[3]);
                    vertices.push([x, y, z]);
                }
            } else if (type === 'f') {
                // 解析面数据
                if (parts.length >= 4) {
                    const faceVertices = [];

                    // 处理每个顶点索引（可能包含纹理/法线索引，我们只取顶点索引）
                    for (let i = 1; i < parts.length; i++) {
                        const vertexPart = parts[i];
                        const vertexIndexMatch = vertexPart.match(/^(\d+)/);

                        if (vertexIndexMatch) {
                            // OBJ索引从1开始，我们需要转换为从0开始
                            const vertexIndex = parseInt(vertexIndexMatch[1]) - 1;
                            if (vertexIndex >= 0 && vertexIndex < vertices.length) {
                                faceVertices.push(vertexIndex);
                            }
                        }
                    }

                    // 只处理三角形和四边形面
                    if (faceVertices.length >= 3) {
                        // 为面分配颜色
                        const colorIndex = faces.length % colors.length;
                        const color = colors[colorIndex];

                        // 如果是四边形，分割成两个三角形
                        if (faceVertices.length === 4) {
                            faces.push([faceVertices[0], faceVertices[1], faceVertices[2], color]);
                            faces.push([faceVertices[0], faceVertices[2], faceVertices[3], color]);
                        } else {
                            // 三角形面
                            faces.push([...faceVertices.slice(0, 3), color]);
                        }
                    }
                }
            }
        }

        return {
            v: vertices,
            f: faces
        };
    }

    /**
     * 从文件加载并解析OBJ模型
     * @param {string} filePath - OBJ文件路径
     * @returns {Promise<Object>} 包含模型数据的Promise
     */
    static async loadFromFile(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load OBJ file: ${response.statusText}`);
            }

            const objContent = await response.text();
            return this.parse(objContent);
        } catch (error) {
            console.error('Error loading OBJ file:', error);
            throw error;
        }
    }
}

export default OBJDecoder;