const { parentPort, workerData } = require("worker_threads");
const cocoSsd = require("@tensorflow-models/coco-ssd");

async function performObjectDetection(imageTensor) {
  try {
    const model = await cocoSsd.load({});
    console.log("test");
    const predictions = await model.detect(imageTensor);
    parentPort.postMessage(predictions);
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  }
}

performObjectDetection(workerData.imageTensor);
