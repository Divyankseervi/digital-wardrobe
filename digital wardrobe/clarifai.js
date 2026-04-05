/**
 * Frontend helper that calls our local Node/Express proxy,
 * which in turn talks to Clarifai (to avoid CORS problems).
 */
export async function detectClothing(imageUrl) {
  try {
    const response = await fetch("http://localhost:4000/api/detect-clothing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      console.error("Proxy detect-clothing error:", response.status);
      return "other";
    }

    const data = await response.json();
    console.log("Proxy Clarifai response:", data);
    return data.category || "other";
  } catch (err) {
    console.error("detectClothing fetch to local server failed:", err);
    return "other";
  }
}

