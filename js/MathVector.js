class MathVector {
    constructor() {
    }

    /**
     * 向量相加
     * @param {Array} v1 第一个向量
     * @param {Array} v2 第二个向量
     * @returns {Array} 向量相加的结果
     */
    static addVector(v1, v2) {
        if (v1.length !== v2.length) {
            throw new Error("非法向量参数：向量v1和v2的维度不一致");
        }
        let result = [];
        for (let i = 0; i < v1.length; i++) {
            result.push(v1[i] + v2[i]);
        }
        return result;
    }

    /**
     * 向量相减
     * @param {Array} v1 第一个向量
     * @param {Array} v2 第二个向量
     * @returns {Array} 向量相减的结果
     */
    static subVector(v1, v2) {
        if (v1.length !== v2.length) {
            throw new Error("非法向量参数：向量v1和v2的维度不一致");
        }
        let result = [];
        for (let i = 0; i < v1.length; i++) {
            result.push(v1[i] - v2[i]);
        }
        return result;
    }

    /**
     * 向量数乘
     * @param {Array} v 向量
     * @param {Number} scalar 标量
     * @returns {Array} 向量数乘的结果
     */
    static scalarVector(v, scalar) {
        let result = [];
        for (let i = 0; i < v.length; i++) {
            result.push(v[i] * scalar);
        }
        return result;
    }

    static scaleVector(v, scalar) {
        return this.scalarVector(v, scalar);
    }

    static scale(v, scalar) {
        return this.scalarVector(v, scalar);
    }

    /**
     * 判断两个向量是否垂直
     * @param {Array} v1 第一个向量
     * @param {Array} v2 第二个向量
     * @returns {Boolean} 是否垂直
     */
    static isTwoVectorVertical(v1, v2) {
        if (v1.length !== v2.length) {
            throw new Error("非法向量参数：向量v1和v2的维度不一致");
        }
        return this.dotProduct(v1, v2) === 0;
    }

    /**
     * 判断向量是否共线
     * 
    */

    static isTwoVectorCollinear(v1, v2) {
        if (v1.length !== v2.length) {
            throw new Error("非法向量参数：向量v1和v2的维度不一致");
        }
        return this.dotProduct(v1, v2) === 0;
    }

    /**
     * 计算垂直于向量v的垂直向量
     * @param {Array} v 输入向量
     * @returns {Array} 垂直于向量v的垂直向量
     */
    static get2DVerticalVector(v) {
        if (v.length !== 2) {
            throw new Error("非法向量参数：向量v的维度不是2");
        }
        return [-v[1], v[0]];
    }

    /**
     * 计算向量的叉积
     * @param {Array} v1 第一个向量
     * @param {Array} v2 第二个向量
     * @returns {Array} 向量的叉积
     */
    static getCrossVector(v1, v2) {
        return [v1[1] * v2[2] - v1[2] * v2[1],
        v1[2] * v2[0] - v1[0] * v2[2],
        v1[0] * v2[1] - v1[1] * v2[0]];
    }

    static crossVector(v1, v2) {
        return this.getCrossVector(v1, v2);
    }

    /**
     * 计算向量的点积
     * @param {Array} v1 第一个向量
     * @param {Array} v2 第二个向量
     * @returns {Number} 向量的点积
     */
    static dotProduct(v1, v2) {
        if (v1.length !== v2.length) {
            throw new Error("非法向量参数：向量v1和v2的维度不一致");
        }
        let sum = 0;
        for (let i = 0; i < v1.length; i++) {
            sum += v1[i] * v2[i];
        }
        return sum;
    }

    static getDotProduct(v1, v2) {
        return this.dotProduct(v1, v2);
    }

    /**
     * 计算向量的长度
     * @param {Array} v 输入向量
     * @returns {Number} 向量的长度
     */
    static getVectorLength(v) {
        return Math.sqrt(this.dotProduct(v, v));
    }

    static getLength(v) {
        return this.getVectorLength(v);
    }

    /**
     * 计算两个点之间的向量
     * @param {Array} dot1 第一个点的坐标
     * @param {Array} dot2 第二个点的坐标
     * @returns {Array} 两个点之间的向量
     */
    static getVectorByTwoDot(dot1, dot2) {
        if (dot1.length !== dot2.length) {
            throw new Error("非法向量参数：向量dot1和dot2的维度不一致");
        }
        return [dot2[0] - dot1[0], dot2[1] - dot1[1], dot2[2] - dot1[2]];
    }

    /**
     * 归一化向量
     * @param {Array} v 输入向量
     * @returns {Array} 归一化后的向量
     */
    static unitVector(v) {
        if (v.length !== 3) {
            throw new Error("非法向量参数：向量v的维度不是3");
        }
        const length = Math.sqrt(this.dotProduct(v, v));
        return [v[0] / length, v[1] / length, v[2] / length];
    }

    static normalize(v) {
        return this.unitVector(v);
    }

    /**
     * 获取点到一个由两个基向量组成的平面的距离
     * @param {Array} dot 点的坐标
     * @param {Array} a 平面上1个点的坐标
     * @param {Array} X 平面的一个基向量
     * @param {Array} Y 平面的另一个不共线的基向量
     * @returns {Number} 点到平面的距离
    */
    static getDistanceToPlane(dot, a, X, Y) {
        if (dot.length !== 3 || a.length !== 3 || X.length !== 3 || Y.length !== 3) {
            throw new Error("非法向量参数：向量dot、a、X、Y的维度不是3");
        }
        return Math.abs(this.dotProduct(this.subVector(dot, a), this.getCrossVector(X, Y))) / this.getVectorLength(this.getCrossVector(X, Y));
    }

    /**
     * 将原始坐标系中的点映射到新的坐标系
     * @param {Array} dot 原始坐标系中的点
     * @param {Array} origin 新坐标系的原点
     * @param {Array} X 新坐标系的X轴向量
     * @param {Array} Y 新坐标系的Y轴向量
     * @param {Array} Z 新坐标系的Z轴向量
     * @returns {Array} 映射到新坐标系中的点坐标
    */
    static reflectDotToNewAxis(dot, origin, X, Y, Z) {
        if (dot.length !== 3) {
            throw new Error("非法向量参数：向量dot的维度不是3");
        } else {
            const unitX = this.unitVector(X);
            const unitY = this.unitVector(Y);
            const unitZ = this.unitVector(Z);
            const a = [dot[0] - origin[0], dot[1] - origin[1], dot[2] - origin[2]];
            return [this.dotProduct(a, unitX), this.dotProduct(a, unitY), this.dotProduct(a, unitZ)];
        }
    }
}
export default MathVector;