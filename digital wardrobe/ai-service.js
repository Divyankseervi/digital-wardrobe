/**
 * Calls the Python FastAPI backend to analyze the image via MobileNetV2.
 * Sends the image as a multipart FormData upload.
 * @param {File} file - The image file to analyze.
 * @returns {Promise<Object>} - The analysis result containing category, color, formality.
 */
export async function analyzeImage(file) {
    try {
        console.log("AI Service: Preparing FormData upload...");
        const formData = new FormData();
        formData.append("file", file);

        console.log("AI Service: Sending to Python backend (FormData)...");
        const response = await fetch("http://localhost:8000/analyze-upload", {
            method: "POST",
            body: formData,
        });

        console.log("AI Service: Response status:", response.status);

        if (!response.ok) {
            const errText = await response.text();
            console.error("AI Service: Backend error:", response.status, errText);
            throw new Error(`Backend analysis failed: ${response.status}`);
        }

        const data = await response.json();
        console.log("AI Service: Result - category:", data.category, "color:", data.color, "formality:", data.formality);

        return {
            category: data.category || "other",
            color: data.color || "Unknown",
            formality: data.formality || "Casual"
        };
    } catch (err) {
        console.error("AI Service Error:", err);
        return { category: "other", color: "Unknown", formality: "Casual" };
    }
}
