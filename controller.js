/**
 * controller.js — Browser-based Car Controller
 * Handles keyboard event simulation within the browser and iframe, removing Node.js backend
 */

let state = { left: false, right: false, up: false, down: false };

const keyCodeMap = {
    'ArrowLeft': 37, 'ArrowUp': 38, 'ArrowRight': 39, 'ArrowDown': 40,
    'KeyA': 65, 'KeyW': 87, 'KeyD': 68, 'KeyS': 83
};

function sendKey(key, code, down) {
    const frame = document.getElementById('game-frame');
    if (!frame) return;
    
    const type = down ? 'keydown' : 'keyup';
    const ev = new KeyboardEvent(type, {
        key: key, 
        code: code,
        keyCode: keyCodeMap[code] || 0,
        which: keyCodeMap[code] || 0,
        bubbles: true, 
        cancelable: true
    });
    
    try {
        if (frame.contentDocument) frame.contentDocument.dispatchEvent(ev);
        if (frame.contentWindow) frame.contentWindow.document.dispatchEvent(ev);
    } catch(e) {}
    document.dispatchEvent(ev);
    window.dispatchEvent(ev);
}

function pressKey(action, isDown) {
    const codes = {
        left:  ['ArrowLeft', 'KeyA'],
        right: ['ArrowRight', 'KeyD'],
        up:    ['ArrowUp', 'KeyW'],
        down:  ['ArrowDown', 'KeyS'],
    };
    const pairs = { 
        ArrowLeft:'ArrowLeft', KeyA:'a', 
        ArrowRight:'ArrowRight', KeyD:'d', 
        ArrowUp:'ArrowUp', KeyW:'w', 
        ArrowDown:'ArrowDown', KeyS:'s' 
    };
    
    (codes[action] || []).forEach(code => {
        const key = pairs[code] || code;
        sendKey(key, code, isDown);
    });
}

function setAction(newLeft, newRight, newUp, newDown) {
    if (newLeft !== state.left) { pressKey('left', newLeft); state.left = newLeft; }
    if (newRight !== state.right) { pressKey('right', newRight); state.right = newRight; }
    if (newUp !== state.up) { pressKey('up', newUp); state.up = newUp; }
    if (newDown !== state.down) { pressKey('down', newDown); state.down = newDown; }

    // Update key UI visually
    const keyLeft = document.getElementById('key-left');
    const keyRight = document.getElementById('key-right');
    const keyUp = document.getElementById('key-up');
    const keyDown = document.getElementById('key-down');
    
    if (keyLeft) keyLeft.classList.toggle('pressed', newLeft);
    if (keyRight) keyRight.classList.toggle('pressed', newRight);
    if (keyUp) keyUp.classList.toggle('pressed', newUp);
    if (keyDown) keyDown.classList.toggle('pressed', newDown);
}

function loadGame() {
    const url = document.getElementById('game-url').value.trim();
    if (!url) return;
    const frame = document.getElementById('game-frame');
    const ph = document.getElementById('placeholder');
    if (!frame || !ph) return;
    frame.src = url;
    frame.style.display = 'block';
    ph.style.display = 'none';
    setTimeout(() => {
        if(frame.contentWindow) frame.contentWindow.focus();
        frame.focus();
    }, 1000);
}

// Expose functions globally so UI elements and script.js can use them
window.setAction = setAction;
window.loadGame = loadGame;
