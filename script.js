/**
 * script.js — MediaPipe Vision Logic
 * Computes steering and gas/brake commands from hand gestures and triggers controller
 */

const videoEl = document.querySelector('.input_video');
const canvasEl = document.querySelector('.output_canvas');
const ctx = canvasEl.getContext('2d');

const wheelWrap = document.getElementById('wheel-wrap');
const cvAngle = document.getElementById('cv-angle');
const cvAction = document.getElementById('cv-action');
const cvGas = document.getElementById('cv-gas');
const cvBrake = document.getElementById('cv-brake');
const statusEl = document.getElementById('status');

function onResults(results) {
    if(!ctx) return;
    ctx.save();
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    ctx.drawImage(results.image, 0, 0, canvasEl.width, canvasEl.height);

    if (results.multiHandLandmarks) {
        for (const lm of results.multiHandLandmarks) {
            drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
            drawLandmarks(ctx, lm, { color: '#FF0000', lineWidth: 1 });
        }
    }
    ctx.restore();

    const handsDetect = results.multiHandLandmarks;
    if (handsDetect && handsDetect.length >= 2) {
        if(wheelWrap) wheelWrap.style.display = 'block';
        if(statusEl) {
            statusEl.textContent = 'AI Aktiv!';
            statusEl.className = 'status active';
        }

        const c1 = handsDetect[0][9], c2 = handsDetect[1][9];
        // Ensure hands are identified as Left / Right based on x coordinates
        const handL = c1.x < c2.x ? handsDetect[0] : handsDetect[1];
        const handR = c1.x < c2.x ? handsDetect[1] : handsDetect[0];
        const cL = c1.x < c2.x ? c1 : c2;
        const cR = c1.x < c2.x ? c2 : c1;

        const dx = cR.x - cL.x;
        const dy = cR.y - cL.y;
        const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

        if(wheelWrap) wheelWrap.style.transform = `rotate(${angleDeg}deg)`;
        if(cvAngle) cvAngle.textContent = `${Math.round(angleDeg)}°`;

        const threshold = 18;
        let doLeft = false, doRight = false;
        
        if (angleDeg < -threshold) {
            doLeft = true;
            if(cvAction) {
                cvAction.textContent = 'Chapga ←';
                cvAction.style.color = '#ff9933';
            }
        } else if (angleDeg > threshold) {
            doRight = true;
            if(cvAction) {
                cvAction.textContent = 'O\'ngga →';
                cvAction.style.color = '#33ff66';
            }
        } else {
            if(cvAction) {
                cvAction.textContent = 'To\'g\'ri';
                cvAction.style.color = '#00ffff';
            }
        }

        // Thumb up logic: higher cursor in canvas means smaller y
        const gasOn   = handR[4].y < handR[5].y - 0.05;
        const brakeOn = handL[4].y < handL[5].y - 0.05;

        if(cvGas) {
            cvGas.textContent = gasOn   ? 'ON ✅' : 'OFF';
            cvGas.style.color = gasOn   ? '#33ff66' : '#aaa';
        }
        if(cvBrake) {
            cvBrake.textContent = brakeOn ? 'ON ✅' : 'OFF';
            cvBrake.style.color = brakeOn ? '#ff3366' : '#aaa';
        }

        if (typeof window.setAction === 'function') {
            window.setAction(doLeft, doRight, gasOn, brakeOn);
        }
    } else {
        if(wheelWrap) wheelWrap.style.display = 'none';
        if(statusEl) {
            statusEl.textContent = 'Qo\'llar aniqlanmadi';
            statusEl.className = 'status';
        }
        if(cvAction) { cvAction.textContent = '—'; cvAction.style.color = '#aaa'; }
        if(cvGas) { cvGas.textContent = 'OFF'; cvGas.style.color = '#aaa'; }
        if(cvBrake) { cvBrake.textContent = 'OFF'; cvBrake.style.color = '#aaa'; }
        
        if (typeof window.setAction === 'function') {
            window.setAction(false, false, false, false);
        }
    }
}

const hands = new Hands({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6, selfieMode: true });
hands.onResults(onResults);

const camera = new Camera(videoEl, {
    onFrame: async () => { await hands.send({ image: videoEl }); },
    width: 640, height: 480
}); 
camera.start();
