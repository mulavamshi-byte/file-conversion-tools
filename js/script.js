// PDF Compression
document.getElementById("pdf-compression-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const fileInput = document.getElementById("pdf-file");
    if (!fileInput.files.length) {
        alert("Please upload a PDF file.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function () {
        const arrayBuffer = reader.result;
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

        // Reduce the size of all embedded images (default compression)
        const newPdfDoc = await PDFLib.PDFDocument.create();
        const copiedPages = await newPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => newPdfDoc.addPage(page));

        const compressedPdfBytes = await newPdfDoc.save();

        // Create a Blob and trigger download
        const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'compressed.pdf';  // Ensure the file is named 'compressed.pdf'
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);  // Clean up the DOM after download
        URL.revokeObjectURL(blobUrl);  // Release memory
    };

    reader.readAsArrayBuffer(file);
});

// DOCX to PDF Conversion
document.getElementById("docx-to-pdf-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const fileInput = document.getElementById("docx-file");
    if (!fileInput.files.length) {
        alert("Please upload a DOCX file.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const arrayBuffer = event.target.result;

        mammoth.extractRawText({ arrayBuffer: arrayBuffer })
            .then(function (result) {
                const text = result.value;  // Extracted plain text from DOCX
                console.log(text);  // Log the plain text for debugging

                // Create a new jsPDF document
                const doc = new window.jspdf.jsPDF();

                // Add the extracted text to the PDF
                doc.text(text, 10, 10);  // Adjust (x, y) for text positioning

                // Trigger download
                doc.save("converted.pdf");
            })
            .catch(function (error) {
                console.error("Error during DOCX conversion:", error);
            });
    };

    reader.readAsArrayBuffer(file);
});

// PDF to DOCX Conversion using pdf.js
document.getElementById("pdf-to-docx-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const fileInput = document.getElementById("pdf-to-docx-file");
    if (!fileInput.files.length) {
        alert("Please upload a PDF file.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const arrayBuffer = event.target.result;

        // Use pdf.js to load and parse the PDF
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        loadingTask.promise.then(function (pdf) {
            let extractedText = '';

            // Loop through each page and extract text
            const pagesPromises = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                pagesPromises.push(pdf.getPage(i).then(function (page) {
                    return page.getTextContent().then(function (textContent) {
                        // Extract text content from each page
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        extractedText += `\n\nPage ${i}:\n${pageText}`;
                    });
                }));
            }

            // Once all pages are processed, create DOCX file
            Promise.all(pagesPromises).then(function () {
                console.log("Extracted Text:", extractedText); // Check extracted text in console

                // Create DOCX file with extracted text
                const doc = new window.docx.Document({
                    sections: [
                        {
                            properties: {},
                            children: [
                                new window.docx.Paragraph({
                                    text: extractedText,
                                    alignment: window.docx.AlignmentType.LEFT,
                                }),
                            ],
                        },
                    ],
                });
                // Trigger DOCX file download
                window.docx.Packer.toBlob(doc).then(blob => {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'converted.docx';  // Filename of the DOCX file
                    link.click();
                }).catch(error => {
                    console.error("Error creating DOCX file:", error);
                });
            });
        }, function (error) {
            console.error("Error loading PDF document:", error);
        });
    };

    reader.readAsArrayBuffer(file);
});
// Excel to PDF Conversion
document.getElementById("excel-to-pdf-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const fileInput = document.getElementById("excel-file");
    if (!fileInput.files.length) {
        alert("Please upload an Excel file.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const arrayBuffer = event.target.result;

        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const sheetData = XLSX.utils.sheet_to_csv(worksheet);

        // Convert the sheet data to PDF using jsPDF
        const doc = new window.jspdf.jsPDF();

        const lines = sheetData.split('\n');
        lines.forEach((line, index) => {
            doc.text(line, 10, 10 + (index * 10));  // Position each line of text on a new row
        });

        // Trigger download of the PDF
        doc.save("excel-converted.pdf");
    };

    reader.readAsArrayBuffer(file);
});
// PDF to Excel Conversion
document.getElementById("pdf-to-excel-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const fileInput = document.getElementById("pdf-to-excel-file");
    if (!fileInput.files.length) {
        alert("Please upload a PDF file.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const arrayBuffer = event.target.result;

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        loadingTask.promise.then(function (pdf) {
            let extractedText = '';
            const pagesPromises = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                pagesPromises.push(pdf.getPage(i).then(function (page) {
                    return page.getTextContent().then(function (textContent) {
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        extractedText += `\n\nPage ${i}:\n${pageText}`;
                    });
                }));
            }

            Promise.all(pagesPromises).then(function () {
                // Create a new Excel workbook
                const workbook = XLSX.utils.book_new();
                const worksheet = XLSX.utils.aoa_to_sheet(extractedText.split('\n').map(line => [line]));

                // Append worksheet to the workbook
                XLSX.utils.book_append_sheet(workbook, worksheet, 'PDF to Excel');

                // Trigger download of the Excel file
                XLSX.writeFile(workbook, 'pdf-converted.xlsx');
            });
        }, function (error) {
            console.error("Error loading PDF document:", error);
        });
    };

    reader.readAsArrayBuffer(file);
});
// PowerPoint (PPTX) to PDF Conversion
document.getElementById("pptx-to-pdf-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const fileInput = document.getElementById("pptx-file");
    if (!fileInput.files.length) {
        alert("Please upload a PowerPoint file.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const arrayBuffer = event.target.result;

        // Load PowerPoint using PptxGenJS
        const pptx = new PptxGenJS();
        pptx.load(arrayBuffer)
            .then(() => {
                const doc = new window.jspdf.jsPDF();

                // Extracting text from slides and adding it to PDF
                pptx.slides.forEach((slide, index) => {
                    const slideText = slide.getText();
                    doc.text(`Slide ${index + 1}: ${slideText}`, 10, 10);
                });

                // Trigger PDF download
                doc.save("converted.pdf");
            })
            .catch((error) => {
                console.error("Error converting PPTX to PDF:", error);
            });
    };

    reader.readAsArrayBuffer(file);
});

// PDF to PowerPoint (PPTX) Conversion
document.getElementById("pdf-to-pptx-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const fileInput = document.getElementById("pdf-to-pptx-file");
    if (!fileInput.files.length) {
        alert("Please upload a PDF file.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const arrayBuffer = event.target.result;

        // Use pdf.js to extract text from PDF
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        loadingTask.promise.then(function (pdf) {
            let extractedText = '';

            // Loop through each page to extract text
            const pagesPromises = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                pagesPromises.push(pdf.getPage(i).then(function (page) {
                    return page.getTextContent().then(function (textContent) {
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        extractedText += `\n\nPage ${i}:\n${pageText}`;
                    });
                }));
            }

            Promise.all(pagesPromises).then(function () {
                // Create PowerPoint using PptxGenJS
                const pptx = new PptxGenJS();
                const slide = pptx.addSlide();
                slide.addText(extractedText, { x: 1, y: 1, fontSize: 18 });

                // Trigger PPTX download
                pptx.writeFile("converted.pptx");
            });
        }, function (error) {
            console.error("Error loading PDF document:", error);
        });
    };

    reader.readAsArrayBuffer(file);
});

window.addEventListener("scroll", function() {
    const footer = document.getElementById('footer');
    
    // Check if the user has scrolled to the bottom
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10) {
        footer.classList.add('visible');  // Show the footer
    } else {
        footer.classList.remove('visible');  // Hide the footer if not at the bottom
    }
});
