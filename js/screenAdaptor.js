/**
 * 适配屏幕大小
*/
function adaptScreen() {
    const screen = document.getElementById("screen");
    screen.setAttribute("width", window.innerWidth);
    screen.setAttribute("height", window.innerHeight);
}

// 立即执行一次
adaptScreen();

// 监听窗口大小变化，适配屏幕大小
window.addEventListener("resize", () => {
    adaptScreen();
})
