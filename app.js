const imageUpload = document.getElementById('image-upload');
const imgPreview = document.getElementById('img-preview');
const video = document.getElementById('video');
const captureBtn = document.getElementById('capture-btn');
const compareBtn = document.getElementById('compare-btn');
const status = document.getElementById('status');
const resultPercent = document.getElementById('result-percent');
const resultText = document.getElementById('result-text');

let capturedDescriptor = null;

// 1. Load Models & Start Camera
async function startApp() {
    const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
    
    try {
        status.innerText = "Loading AI models...";
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        
        status.innerText = "Models Loaded. Accessing Camera...";
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
        
        status.innerText = "Systems Ready!";
        compareBtn.disabled = false;
    } catch (err) {
        status.innerText = "Error: Please allow camera access and check internet.";
        console.error(err);
    }
}

// 2. Preview the uploaded file
imageUpload.addEventListener('change', () => {
    const file = imageUpload.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => imgPreview.src = e.target.result;
        reader.readAsDataURL(file);
    }
});

// 3. Capture face from the live video
captureBtn.addEventListener('click', async () => {
    status.innerText = "Capturing face features...";
    const detection = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
    
    if (detection) {
        capturedDescriptor = detection.descriptor;
        status.innerText = "Face B Captured Successfully!";
        captureBtn.innerText = "Retake Photo";
        captureBtn.style.background = "#ffc107";
    } else {
        alert("Face not detected. Please look clearly at the camera.");
        status.innerText = "Capture failed. Try again.";
    }
});

// 4. Compare the two faces
compareBtn.addEventListener('click', async () => {
    if (!imageUpload.files[0] || !capturedDescriptor) {
        alert("Upload Person A and Capture Person B first!");
        return;
    }

    status.innerText = "Calculating match percentage...";
    
    // Process Uploaded Image
    const imgA = await faceapi.bufferToImage(imageUpload.files[0]);
    const detectionA = await faceapi.detectSingleFace(imgA).withFaceLandmarks().withFaceDescriptor();

    if (!detectionA) {
        status.innerText = "No face found in Uploaded Image.";
        return;
    }

    // Compare with Captured Descriptor (Euclidean Distance)
    const distance = faceapi.euclideanDistance(detectionA.descriptor, capturedDescriptor);
    
    // Logic: 0.0 distance = 100% match, 0.6 distance = 60% match (standard threshold)
    let matchScore = Math.max(0, (1 - distance) * 100);
    
    resultPercent.innerText = matchScore.toFixed(1) + "%";
    
    if (matchScore > 65) {
        resultText.innerText = "Verified: Same Person!";
        resultText.style.color = "green";
    } else {
        resultText.innerText = "Different People / Low Similarity";
        resultText.style.color = "red";
    }
    status.innerText = "Analysis Complete.";
});

startApp();