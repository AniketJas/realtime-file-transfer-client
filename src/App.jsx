import { useState, useRef } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef();

  const uploadFile = async () => {
    if (!file || uploading) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/files/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          onUploadProgress: (event) => {
            // Guard against undefined total
            if (!event.total) return;

            const percent = Math.round(
              (event.loaded * 100) / event.total
            );

            // Prevent backward jumps (rare but real)
            setProgress((prev) => Math.max(prev, percent));
          }
        }
      );

      setLink(res.data.downloadUrl);

      // Lock at 100% for good UX
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setLink("");
    setProgress(0);
    setError("");

    // Reset actual input element (important!)
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    // Reset previous state when new file is selected
    setFile(selectedFile);
    setLink("");
    setProgress(0);
    setError("");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>File Transfer</h1>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <div style={{ marginTop: "10px" }}>
        <button
          onClick={uploadFile}
          disabled={!file || uploading}
          style={{ marginRight: "10px" }}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>

        <button onClick={reset} disabled={uploading}>
          Send New File
        </button>
      </div>

      {/* Uploading State */}
      {file && uploading && (
        <div style={{ marginTop: "20px" }}>
          <p><strong>{file.name}</strong></p>
          <p>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          <p>Uploading: {progress}%</p>

          <div
            style={{
              width: "300px",
              height: "20px",
              border: "1px solid black",
              borderRadius: "4px",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "green",
                transition: "width 0.2s ease"
              }}
            />
          </div>
        </div>
      )}

      {/* Success State */}
      {link && !uploading && (
        <div style={{ marginTop: "20px" }}>
          <p>Upload complete ✅</p>
          <a href={link} target="_blank" rel="noreferrer">
            {link}
          </a>
        </div>
      )}

      {/* Error State */}
      {error && (
        <p style={{ color: "red", marginTop: "20px" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default App;