const audioFileInput = document.getElementById("audioFile");
const resultsDisplay = document.getElementById("results");
const waveformContainer = document.getElementById("waveform");
const exportBeatsBtn = document.getElementById("exportBeatsBtn");

// Initialize Wavesurfer
const wavesurfer = WaveSurfer.create({
  container: waveformContainer,
  waveColor: "lightblue",
  progressColor: "blue",
  height: 150,
  responsive: true,
});

audioFileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) {
    alert("Please upload an audio file.");
    return;
  }

  // Read the audio file as a Blob URL for Wavesurfer
  const fileURL = URL.createObjectURL(file);
  wavesurfer.load(fileURL);

  // Process the file for beat detection
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Analyze the beats
  const beats = detectBeats(audioBuffer, audioContext.sampleRate);

  // Display results and mark beats
  resultsDisplay.textContent = beats.join("\n");
  
  // Show the export button when beats are detected
  exportBeatsBtn.style.display = 'inline-block';

  wavesurfer.on("ready", () => {
    beats.forEach((beatTime) => {
      wavesurfer.addRegion({
        start: parseFloat(beatTime),
        end: parseFloat(beatTime) + 0.1, // Mark the beat with a short region
        color: "rgba(255, 0, 0, 0.5)",
      });
    });
  });
});

/**
 * Detect beats in an audio buffer.
 * @param {AudioBuffer} audioBuffer - The decoded audio data.
 * @param {number} sampleRate - The sample rate of the audio.
 * @returns {number[]} - An array of beat timestamps (in seconds).
 */
function detectBeats(audioBuffer, sampleRate) {
  const channelData = audioBuffer.getChannelData(0); // Use the first channel
  const threshold = 0.4; // Adjust sensitivity for beat detection
  const beats = [];
  let lastBeatTime = 0;

  for (let i = 0; i < channelData.length; i++) {
    // Convert sample index to time in seconds
    const currentTime = i / sampleRate;

    // Detect peaks above the threshold
    if (channelData[i] > threshold && currentTime - lastBeatTime > 0.2) {
      beats.push(currentTime.toFixed(2)); // Save the beat timestamp
      lastBeatTime = currentTime;
    }
  }

  return beats;
}

// Export Beats as a Text File
exportBeatsBtn.addEventListener("click", () => {
  const beats = resultsDisplay.textContent.trim().split("\n");

  if (beats.length === 0) {
    alert("No beats detected to export.");
    return;
  }

  // Create a Blob from the beats data
  const blob = new Blob([beats.join("\n")], { type: "text/plain" });
  
  // Create a download link and simulate click to download the file
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "beats.txt";
  link.click();
});
