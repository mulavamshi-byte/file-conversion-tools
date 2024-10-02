// Select the area and input elements
const dropArea = document.getElementById("uploadfile");
const fileInput = document.getElementById("fileInput");
const fileNameDisplay = document.getElementById("fileName");

// Prevent default drag behaviors
["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

// Highlight the drag area when the file is being dragged
["dragenter", "dragover"].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.add("dragging"), false);
});

// Unhighlight the drag area when the file is no longer being dragged
["dragleave", "drop"].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.remove("dragging"), false);
});

// Handle dropped files
dropArea.addEventListener("drop", handleDrop, false);

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Handle file drop
function handleDrop(e) {
    let files = e.dataTransfer.files;
    handleFiles(files);
}

// Display selected or dropped files
function handleFiles(files) {
    let fileNames = Array.from(files).map(file => file.name).join(", ");
    fileNameDisplay.textContent = `Selected file(s): ${fileNames}`;
}

// Handle file selection through the input field
fileInput.addEventListener("change", () => {
    let files = fileInput.files;
    handleFiles(files);
});
