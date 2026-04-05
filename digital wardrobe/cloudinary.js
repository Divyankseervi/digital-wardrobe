export async function uploadImage(file) {
  const cloudName = "ddcxzmusc";
  const uploadPreset = "wardrobe_upload";

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(url, { method: "POST", body: formData });
  const data = await response.json();

  return data.secure_url;
}
