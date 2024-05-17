// index.js
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const sharp = require("sharp");
const tf = require("@tensorflow/tfjs");

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  "http://localhost:5173", // Front-End Localhost
  "https://gradtest.vercel.app",
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
    model = await tf.loadLayersModel(
      `https://drive.google.com/uc?export=download&id=1---irB8FRMYQR5uPWHaNB5kzN_Ifn8k7` // model.h5
    );
  
    console.log("Model loaded");
  } catch (err) {
    console.error("Failed to load model", err);
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

    // Resize images to a smaller size before detection
    const resizedImage = await sharp(imageBuffer)
      .resize({ width: 100, height: 100, fit: "inside" }) // Resize to a smaller size
      .toBuffer();

    // Convert resized image buffer to tensor
    const { data, info } = await sharp(resizedImage)
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Convert image data to tensor
    const imageTensor = tf.tensor3d(data, [
      info.height,
      info.width,
      info.channels,
    ]);

    // Perform object detection
    const predictions = await model.classify(imageTensor);

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
loadModel()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to load model:", err);
  });
