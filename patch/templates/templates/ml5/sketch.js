let handPose;
let hands = [];
var p5jsConfigured = false;
let video;
let canvas;

function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function gotHands(results) {
  hands = results;
}

function setup() {
  noLoop();
}

async function startVideo() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const videoElement = document.createElement("video");
  videoElement.srcObject = stream;
  videoElement.onloadedmetadata = () => {
    const webcamWidth = videoElement.videoWidth;
    const webcamHeight = videoElement.videoHeight;
    canvas = createCanvas(webcamWidth, webcamHeight);
    canvas.parent("p5js");
    video = createCapture(VIDEO, { flipped: true });
    video.hide();
    handPose.detectStart(video, gotHands);
    videoElement.remove();
    loop();
  };
}

function draw() {
  // Draw the webcam video
  image(video, 0, 0, width, height);

  // Draw all the tracked hand points
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];
      let handLorR = hand.handedness;
      fill(255, 0, 0);
      noStroke();
      circle(keypoint.x, keypoint.y, 5);
      if (Pd4Web && Pd4Web.sendList && hand.confidence > 0.95) {
        let x = keypoint.x / width;
        let y = keypoint.y / height;
        if (handLorR == "Left") {
          let r = "L-" + j;
          Pd4Web.sendList(r, [x, y]);
          //console.log(handLorR + "-" + j + " : " + x + ", " + y);
        } else if (handLorR == "Right") {
          let r = "R-" + j;
          Pd4Web.sendList(r, [x, y]);
          //console.log(handLorR + "-" + j + " : " + x + ", " + y);
        }
      }
    }
  }
}
