// Define labels of the TF Lite model.
const classLabels = {
    0: "Open Litter",
    1: "Overflow Dustbin",
    2: "Plastic Waste",
    3: "Biodegradable Waste",
    4: "Medical Waste"
};

// Define colours for the labels.
const classColors = {
    "Open Litter": "#F44336",
    "Overflow Dustbin": "#388E3C",
    "Plastic Waste": "#2979FF",
    "Biodegradable Waste": "#E040FB",
    "Medical Waste": "#FF6D00"
};

// Define max no. of detections per image, threshold and model path.
const MAX_DETECTIONS = 5;
const THRESHOLD = 0.4;
const MODEL_PATH = "./model/waste.tflite";

const imageInput = document.getElementById("image-input");
const img = document.getElementById("input-image");
const text = document.querySelector(`.text`);
let objectDetector;


// Load the input image.
imageInput.addEventListener("change", (event) => {
    console.log("imageInput Changed!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            img.src = e.target.result;
            const boxesContainer = document.querySelector(".boxes-container");
            boxesContainer.innerHTML = "";
        };
        reader.readAsDataURL(file);
    }
});


// Run the detector.
async function detect() {
    const boxesContainer = document.querySelector(".boxes-container");
    boxesContainer.innerHTML = "";

    text.textContent = "Loading...";
    // Load the TF Lite model.
    if (!objectDetector) {
        text.textContent = "Now Loading...";
        objectDetector = await tflite.loadTFLiteModel(MODEL_PATH);
    }

    text.textContent = "TF Lite model loaded successfully."
   
    let input = tf.image.resizeBilinear(tf.browser.fromPixels(img), [448, 448]);
    input = tf.cast(tf.expandDims(input), 'int32');
    
    // Get the output tensors.
    let result = await objectDetector.predict(input);

    // Interpret the output tensors to get box coordinates, classes, scores, and no. of detections respectively.
    let boxes = Array.from(await result[Object.keys(result)[0]].data());
    let classes = Array.from(await result[Object.keys(result)[1]].data())
    let scores = Array.from(await result[Object.keys(result)[2]].data())
    let n = Array.from(await result[Object.keys(result)[3]].data())
    inferenceResults(boxes, classes, scores, n);
}

// Render and inference the detection results.
function inferenceResults(boxes, classes, scores, n) {
    const boxesContainer = document.querySelector(".boxes-container");
    boxesContainer.innerHTML = "";

    const detections = [];

    for (let i = 0; i < n; i++) {
        const boundingBox = boxes.slice(i*4, (i+1)*4);
        const classIndex = classes[i];
        const className = classLabels[classIndex];
        const score = scores[i];
        detections.push({ boundingBox, className, score, index: i });
    }

    // Sort the results in the order of confidence to get top results.
    detections.sort((a, b) => b.score - a.score);

    const numDetectionsToShow = Math.min(MAX_DETECTIONS, detections.length);
    for (let i = 0; i < numDetectionsToShow; i++) {
        const detection = detections[i];
        const { boundingBox, className, score, index } = detection;
        const y_min = Math.floor(boundingBox[0] * img.clientHeight);
        const y_max = Math.floor(boundingBox[2] * img.clientHeight);
        const x_min = Math.floor(boundingBox[1] * img.clientWidth);
        const x_max = Math.floor(boundingBox[3] * img.clientWidth);

        // Draw the boxes if the confidence is greater than threshold.
        if (score > THRESHOLD) {
            const color = classColors[className]
            const boxContainer = drawBoundingBoxes(
                x_min,
                y_min,
                x_max - x_min,
                y_max - y_min,
                className,
                score,
                color
            );
            boxesContainer.appendChild(boxContainer);
        } 
    }
}

// Draw bounding boxes for top 'N' detections.
function drawBoundingBoxes(left, top, width, height, className, score, color) {
    const container = document.createElement("div");
    container.classList.add("box-container");

    const box = document.createElement("div");
    box.classList.add("box");
    box.style.borderColor = color;
    box.style.borderWidth = "4px";
    container.appendChild(box);

    const label = document.createElement("div");
    label.classList.add("label");
    label.style.backgroundColor = color;
    label.textContent = `${className} (${score.toFixed(2)})`;
    container.appendChild(label);

    // Adjust the position based on the centered image.
    const imgElement = document.getElementById("input-image");
    const imgRect = imgElement.getBoundingClientRect();
    const offsetX = imgRect.left;

    container.style.left = `${left + offsetX - 1}px`;
    container.style.top = `${top - 10}px`;
    box.style.width = `${width + 1}px`;
    box.style.height = `${height + 1}px`;

    return container;
}

document.querySelector(".btn").addEventListener("click", () => {
    detect();
});
