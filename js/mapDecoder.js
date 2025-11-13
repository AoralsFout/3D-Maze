/**
 * 地图解码器
 * 将.map文件解码为地图数据
 */
class MapDecoder {
    constructor(fileUrl) {
        this.fileUrl = fileUrl;
    }

    scale(n) {
        return n * 2;
    }

    /**
     * 解码地图数据
     * @returns {Promise} 地图数据
     */
    async decodeMap() {
        const response = await fetch(this.fileUrl);
        const mapData = await response.text();
        // 解析地图数据
        const lines = mapData.split('\n');
        if (lines.length === 0) {
            throw new Error('地图文件为空');
        }
        if (lines[0].trim() !== 'this is a map file for 3d-maze.') {
            throw new Error('地图文件格式错误');
        }

        const data = lines.filter(line => line.trim().startsWith('y')).map(line => line.trim().substring(1).split(',')).map(arr => arr.map(str => str.trim()));

        console.log(data);
        

        let v = [];
        let f = [];
        let m = {};

        // 辅助函数：检查指定位置是否有方块
        function hasBlock(x, y, z, data) {
            if (x < 0 || y < 0 || x >= data.length || y >= data[x].length) {
                return false;
            }
            const height = Number(data[x][y]);
            return z >= 0 && z < height;
        }

        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].length; j++) {
                const n = Number(data[i][j]);
                if (n < 0) {
                    throw new Error('地图文件数据错误');
                } else {
                    if (n == 0) {
                        continue;
                    }
                    const p1 = v.push([this.scale(i), this.scale(j), this.scale(0)]) - 1;
                    const p2 = v.push([this.scale(i + 1), this.scale(j), this.scale(0)]) - 1;
                    const p3 = v.push([this.scale(i), this.scale(j + 1), this.scale(0)]) - 1;
                    const p4 = v.push([this.scale(i + 1), this.scale(j + 1), this.scale(0)]) - 1;
                    const p5 = v.push([this.scale(i), this.scale(j), this.scale(n)]) - 1;
                    const p6 = v.push([this.scale(i + 1), this.scale(j), this.scale(n)]) - 1;
                    const p7 = v.push([this.scale(i), this.scale(j + 1), this.scale(n)]) - 1;
                    const p8 = v.push([this.scale(i + 1), this.scale(j + 1), this.scale(n)]) - 1;

                    // 检查每个面是否被相邻方块包围，如果没有则添加
                    // 底面
                    if (!hasBlock(i, j, -1, data)) {
                        f.push([p1, p2, p4, '#666666']);
                        f.push([p1, p3, p4, '#666666']);
                    }

                    // 顶面
                    if (!hasBlock(i, j, n, data)) {
                        f.push([p5, p6, p8, '#666666']);
                        f.push([p5, p7, p8, '#666666']);
                    }

                    // X方向正面 (i+1方向)
                    if (!hasBlock(i + 1, j, 0, data) || Number(data[i + 1] ? data[i + 1][j] : 0) < n) {
                        f.push([p2, p4, p6, '#666666']);
                        f.push([p4, p6, p8, '#666666']);
                    }

                    // Y方向正面 (j+1方向)
                    if (!hasBlock(i, j + 1, 0, data) || Number(data[i] ? data[i][j + 1] : 0) < n) {
                        f.push([p3, p4, p7, '#666666']);
                        f.push([p4, p7, p8, '#666666']);
                    }

                    // X方向背面 (i-1方向)
                    if (!hasBlock(i - 1, j, 0, data) || Number(data[i - 1] ? data[i - 1][j] : 0) < n) {
                        f.push([p3, p7, p5, '#666666']);
                        f.push([p1, p3, p5, '#666666']);
                    }

                    // Y方向背面 (j-1方向)
                    if (!hasBlock(i, j - 1, 0, data) || Number(data[i] ? data[i][j - 1] : 0) < n) {
                        f.push([p1, p2, p5, '#666666']);
                        f.push([p2, p5, p6, '#666666']);
                    }
                }
            }
        }

        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].length; j++) {
                const p1 = v.push([this.scale(i), this.scale(j), 0]) - 1;
                const p2 = v.push([this.scale(i + 1), this.scale(j), 0]) - 1;
                const p3 = v.push([this.scale(i), this.scale(j + 1), 0]) - 1;
                const p4 = v.push([this.scale(i + 1), this.scale(j + 1), 0]) - 1;
                const p5 = v.push([this.scale(i), this.scale(j), this.scale(2)]) - 1;
                const p6 = v.push([this.scale(i + 1), this.scale(j), this.scale(2)]) - 1;
                const p7 = v.push([this.scale(i), this.scale(j + 1), this.scale(2)]) - 1;
                const p8 = v.push([this.scale(i + 1), this.scale(j + 1), this.scale(2)]) - 1;
                let color;
                if ((i + j) % 2 == 0) {
                    color = '#434343';
                } else {
                    color = '#353535';
                }
                f.push([p1, p2, p4, color]);
                f.push([p1, p3, p4, color]);
                f.push([p5, p6, p8, color]);
                f.push([p5, p7, p8, color]);
            }
        }

        function isSame(p1, p2) {
            let is;
            if (p1 === undefined || p2 === undefined || p1 === null || p2 === null || p1.length !== p2.length) {
                return false;
            }
            if (p1.length == p2.length) {
                is = true;
            }
            for (let i = 0; i < p1.length; i++) {
                if (p1[i] !== p2[i]) {
                    is = false;
                    break;
                }
            }
            return is;
        }

        function isSameFace(p1, p2) {
            let is;
            if (p1.length == p2.length) {
                is = true;
            } else {
                return false;
            }
            // 数组元素顺序无关
            for (let i = 0; i < p1.length; i++) {
                if (!p2.includes(p1[i])) {
                    is = false;
                    break;
                }
            }
            return is;
        }


        // 去重
        for (let i = v.length - 1; i >= 0; i--) {
            for (let j = i - 1; j >= 0; j--) {
                if (isSame(v[i], v[j])) {
                    v.splice(j, 1);
                    for (let k = 0; k < f.length; k++) {
                        for (let l = 0; l < f[k].length - 1; l++) {
                            if (f[k][l] == j) {
                                f[k][l] = i;
                            }
                            if (f[k][l] >= j) {
                                f[k][l]--;
                            }
                        }
                    }
                    i--;
                }
            }
        }
        for (let i = f.length - 1; i >= 0; i--) {
            for (let j = i - 1; j >= 0; j--) {
                if (isSameFace(f[i], f[j])) {
                    f.splice(j, 1);
                    i--;
                }
            }
        }

        m['v'] = v;
        m['f'] = f;

        console.log(m);

        return m;
    }
}

export default MapDecoder;