const videoElement = document.getElementsByClassName("input_video")[0];
const canvasElement = document.getElementsByClassName("output_canvas")[0];
const canvasCtx = canvasElement.getContext("2d");

const steeringContainer = document.getElementById("steering-wheel-container");
const angleValue = document.getElementById("angle-value");
const actionValue = document.getElementById("action-value");
const statusBadge = document.getElementById("status");
const gasValue = document.getElementById("gas-value");
const brakeValue = document.getElementById("brake-value");

let lastAction = "center";
let lastGas = false;
let lastBrake = false;

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Canvas context naturally matches selfieMode=true without needing extra flipping.

  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height,
  );

  let twoHandsPresent =
    results.multiHandLandmarks && results.multiHandLandmarks.length >= 2;

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 3,
      });
      drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 1 });
    }
  }
  canvasCtx.restore();

  if (twoHandsPresent) {
    steeringContainer.style.display = "block";

    statusBadge.textContent = "AI Aktiv!";
    statusBadge.className = "status active";

    const hand1 = results.multiHandLandmarks[0];
    const hand2 = results.multiHandLandmarks[1];

    const center1 = hand1[9];
    const center2 = hand2[9];

    let fullHandA = center1.x < center2.x ? hand1 : hand2; // User's Left hand
    let fullHandB = center1.x < center2.x ? hand2 : hand1; // User's Right hand
    
    let handA = center1.x < center2.x ? center1 : center2;
    let handB = center1.x < center2.x ? center2 : center1;

    const dx = handB.x - handA.x;
    const dy = handB.y - handA.y;

    let angleRad = Math.atan2(dy, dx);
    let angleDeg = angleRad * (180 / Math.PI);

    steeringContainer.style.transform = `rotate(${angleDeg}deg)`;
    angleValue.textContent = `${Math.round(angleDeg)}°`;

    let threshold = 18; 
    let action = "center";

    if (angleDeg < -threshold) {
      action = "left";
      actionValue.textContent = "Chapga (Left)";
      actionValue.style.color = "#ff3366";
      actionValue.style.textShadow = "0 0 10px #ff3366";
    } else if (angleDeg > threshold) {
      action = "right";
      actionValue.textContent = "O'ngga (Right)";
      actionValue.style.color = "#33ff66";
      actionValue.style.textShadow = "0 0 10px #33ff66";
    } else {
      action = "center";
      actionValue.textContent = "To'g'ri";
      actionValue.style.color = "#00ffff";
      actionValue.style.textShadow = "0 0 10px rgba(0, 255, 255, 0.5)";
    }

    let thumbTipBtnB = fullHandB[4];
    let indexMcpBtnB = fullHandB[5];
    let isGasOn = (thumbTipBtnB.y < indexMcpBtnB.y - 0.05);

    let thumbTipBtnA = fullHandA[4];
    let indexMcpBtnA = fullHandA[5];
    let isBrakeOn = (thumbTipBtnA.y < indexMcpBtnA.y - 0.05);

    if (isGasOn) {
      gasValue.textContent = "ON (Gaz)";
      gasValue.style.color = "#33ff66";
      gasValue.style.textShadow = "0 0 10px #33ff66";
    } else {
      gasValue.textContent = "OFF";
      gasValue.style.color = "#aaa";
      gasValue.style.textShadow = "none";
    }

    if (isBrakeOn) {
      if(brakeValue) {
          brakeValue.textContent = "ON (Tormoz)";
          brakeValue.style.color = "#ff3366";
          brakeValue.style.textShadow = "0 0 10px #ff3366";
      }
    } else {
      if(brakeValue) {
          brakeValue.textContent = "OFF";
          brakeValue.style.color = "#aaa";
          brakeValue.style.textShadow = "none";
      }
    }

    if (action !== lastAction || isGasOn !== lastGas || isBrakeOn !== lastBrake) {
      fetch(`http://localhost:5000/steer?action=${action}&gas=${isGasOn}&brake=${isBrakeOn}`).catch((e) => {});
      lastAction = action;
      lastGas = isGasOn;
      lastBrake = isBrakeOn;
    }
  } else {
    steeringContainer.style.display = "none";
    angleValue.textContent = "0°";
    actionValue.textContent = "Kutilyapti...";
    actionValue.style.color = "#aaa";
    actionValue.style.textShadow = "none";
    statusBadge.textContent = "Qo'llar aniqlanmadi";
    statusBadge.className = "status";
    
    if (gasValue) {
      gasValue.textContent = "OFF";
      gasValue.style.color = "#aaa";
      gasValue.style.textShadow = "none";
    }
    if (brakeValue) {
      brakeValue.textContent = "OFF";
      brakeValue.style.color = "#aaa";
      brakeValue.style.textShadow = "none";
    }

    if (lastAction !== "center" || lastGas !== false || lastBrake !== false) {
      fetch(`http://localhost:5000/steer?action=center&gas=false&brake=false`).catch((e) => {});
      lastAction = "center";
      lastGas = false;
      lastBrake = false;
    }
  }
}

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  },
});
hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6,
  selfieMode: true,
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480,
});
camera.start();
