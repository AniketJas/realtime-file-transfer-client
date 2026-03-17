import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");

  const uploadFile = async () => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post(
      "/api/files/upload",
      formData
    );

    setLink(res.data.downloadUrl);
  };

  const reset = () => {
    setFile(null);
    setLink("");
  }

  return (
    <div>
      <h1>File Transfer</h1>

      <input
        type="file"
        // value={file}
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={uploadFile}>
        Upload
      </button>

      <button onClick={reset}>
        Send New File
      </button>

      {link && (
        <div>
          Download link:
          <a href={link}>{link}</a>
        </div>
      )}
    </div>
  );
}

export default App;