// index.js
const express = require("express");
const multer = require("multer");
require("@tensorflow-models/coco-ssd");
require("@tensorflow/tfjs-backend-cpu");
const cors = require("cors");
const sharp = require("sharp");
const tf = require("@tensorflow/tfjs-node");

const cocoSsd = require("@tensorflow-models/coco-ssd");

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  "https://novabot.vercel.app", // Front-End Production
  "http://localhost:5173", // Front-End Localhost
];

// Middlewares
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["POST", "GET", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// Multer configuration for handling image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

let model;

async function loadModel() {
  try {
    model = await cocoSsd.load({});
    console.log("Model loaded");
  } catch (err) {
    console.error("Failed to load model", err);
    // Exit the process if model loading fails
    process.exit(1);
  }
}

// Middleware to ensure model is loaded before handling requests
app.use((req, res, next) => {
  if (!model) {
    return res.status(503).json({
      error: "Service Unavailable",
      message: "Model is not loaded",
    });
  }
  next();
});

// Route for uploading images and performing object detection
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const imageBuffer = req.file.buffer;

    const startTime = new Date();



    // Convert image buffer to tensor
    const image = tf.node.decodeImage(imageBuffer, 3);
    const imageTensor = tf.expandDims(image, 0);
    

    

    const predictions = await model.detect(imageTensor);

    console.log("Predictions:", predictions);
    const endTime = new Date();
    const timeTaken = endTime - startTime;
    console.log("Time taken:", timeTaken, "ms");

    // Send predictions back to the client
    res.json({ predictions });
  } catch (error) {
    console.error("Error occurred during object detection:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server only after the model is loaded
loadModel().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to load model:', err);
});
