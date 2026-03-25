import { useState, useRef } from "react";
import axios from "axios";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

function App() {
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef();

  // 🔹 Split file into chunks
  const createChunks = (file) => {
    const chunks = [];
    let start = 0;

    while (start < file.size) {
      const chunk = file.slice(start, start + CHUNK_SIZE);
      chunks.push(chunk);
      start += CHUNK_SIZE;
    }

    return chunks;
  };

  const uploadFile = async () => {
    if (!file || uploading) return;

    setUploading(true);
    setError("");
    setProgress(0);
    setLink("");

    const chunks = createChunks(file);
    const totalChunks = chunks.length;

    try {
      // 🔹 Upload chunks one by one
      for (let i = 0; i < totalChunks; i++) {
        const formData = new FormData();

        formData.append("chunk", chunks[i]);
        formData.append("chunkIndex", i);
        formData.append("totalChunks", totalChunks);
        formData.append("fileName", file.name);

        await axios.post(
          "http://localhost:5000/api/files/upload-chunk",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          }
        );

        // 🔹 Update progress based on chunks uploaded
        const percent = Math.round(((i + 1) / totalChunks) * 100);
        setProgress(percent);
      }

      // 🔹 Merge chunks on server
      const res = await axios.post(
        "http://localhost:5000/api/files/merge",
        {
          fileName: file.name,
          totalChunks
        }
      );

      setLink(res.data.downloadUrl);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError("Upload failed during chunk transfer.");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setLink("");
    setProgress(0);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLink("");
    setProgress(0);
    setError("");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Chunked File Transfer</h1>

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