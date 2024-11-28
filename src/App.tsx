import { useEffect, useState } from "react";
import { initialize, svg2png } from "svg2png-wasm";
import wasmFile from "/svg2png_wasm_bg.wasm?url";
import "./App.css";

function App() {
  const [svg, setSvg] = useState<string>();
  const [png, setPng] = useState<Uint8Array>();
  const [scale, setScale] = useState<number>(1);
  const [metadata, setMetadata] = useState<
    { width: number; height: number; name: string }
  >({ width: 0, height: 0, name: "" });

  async function onUpload(e: React.FormEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    const text = await file?.text();

    setMetadata((prev) => ({ ...prev, name: file?.name }));
    setSvg(text);
  }

  async function generatePNG() {
    if (!svg || !metadata) return;
    const png = await svg2png(svg, {
      backgroundColor: "rgba(0,0,0,0)",
      scale: scale,
      width: Math.floor(metadata.width * scale),
      height: Math.floor(metadata.height * scale),
    });
    setPng(png);
  }

  async function getDimensions() {
    if (!svg) return;
    const parser = new DOMParser();
    const imgElement = parser.parseFromString(svg, "image/svg+xml");
    const svgElement = imgElement.activeElement as SVGSVGElement;
    const width = svgElement.width.baseVal.value,
      height = svgElement.height.baseVal.value;
    setMetadata((prev) => ({
      ...prev,
      width,
      height,
    }));
  }

  function handleCancel() {
    setSvg("");
    setPng(new Uint8Array());
    setMetadata({ width: 0, height: 0, name: "" });
    setScale(1);
  }

  async function handleDownload() {
    await generatePNG();
    if (!svg || !png) return;
    const url = URL.createObjectURL(new Blob([png]));
    const downloadLink = document.createElement("a");
    downloadLink.setAttribute(
      "download",
      `${metadata.name.replace(".svg", "")}-${scale}x.png`,
    );
    downloadLink.href = url;
    downloadLink.click();
    URL.revokeObjectURL(url);
    downloadLink.remove();
  }

  useEffect(() => {
    initialize(wasmFile).finally(() => {
      console.info(`wasm loaded`);
    });
  }, []);

  useEffect(() => {
    getDimensions();
    generatePNG().finally(() => {
      console.log("generated");
    });
  }, [svg]);

  return (
    <>
      {!svg &&
        (
          <>
            <p>
              Transform SVGs into PNGs. Using the power of wasm.
            </p>
            <div className="card">
              <input
                type="file"
                accept=".svg"
                id="file-input"
                hidden
                onChange={onUpload}
              />
              <label className="svg-button" htmlFor="file-input">
                Upload SVG
              </label>
            </div>
          </>
        )}

      {svg &&
        (
          <>
            <img src={svg!} alt="" />
            <p className="file-name"></p>
            <div className="box">
              <p>Original</p>
              <p>{metadata.width}w x {metadata.height}h</p>
            </div>
            <div className="box">
              <p>Scaled</p>
              <p>{metadata.width * scale}w x {metadata.height * scale}h</p>
            </div>
            <div className="scale-menu">
              <p className="scale-factor">Scale Factor</p>
              <button onClick={() => setScale(1)}>1x</button>
              <button onClick={() => setScale(2)}>2x</button>
              <button onClick={() => setScale(4)}>4x</button>
              <button onClick={() => setScale(8)}>8x</button>
              <button onClick={() => setScale(16)}>16x</button>
              <button onClick={() => setScale(32)}>32x</button>
              <button onClick={() => setScale(64)}>64x</button>
            </div>
            <div className="buttons">
              <button className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button className="download-btn" onClick={handleDownload}>
                Download
              </button>
            </div>
          </>
        )}
    </>
  );
}

export default App;
