import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

interface Prediction {
  bbox: number[];
  className: string;
  probability: number;
}

export function ObjectDetector() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  const onSelectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const startTime = new Date();

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post(
        "https://api-gradtest.vercel.app/upload",
        formData
      );

      const data = response.data;
      console.log("Predictions:", data.predictions);

      setPredictions(data.predictions);
    } catch (error) {
      console.error("Error occurred while fetching predictions:", error);
      setPredictions([]);
    }
    const endTime = new Date();
    const timeTaken = Number(endTime) - Number(startTime);
    console.log("Time taken:", timeTaken, "ms");
  };

  useEffect(() => {
    console.log("Updated Predictions:", predictions);
  }, [predictions]);

  return (
    <div>
      <div>
        {predictions.length > 0 && (
          <ul>
            {predictions.map((prediction, index) => (
              <li
                key={index}
              >{`${prediction.className} - Score: ${prediction.probability}`}</li>
            ))}
          </ul>
        )}
      </div>
      <input type="file" ref={fileInputRef} onChange={onSelectImage} />
    </div>
  );
}
