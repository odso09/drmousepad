import { useState } from "react";
import { HexColorPicker } from "react-colorful";

export function ColorPicker({ color, onChange }: { color: string; onChange: (color: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        aria-label="Elegir color de texto"
        onClick={() => setShow((v) => !v)}
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          border: "2px solid #444",
          background: color,
          cursor: "pointer",
        }}
      />
      {show && (
        <div style={{ position: "absolute", zIndex: 10, top: 40, left: 0 }}>
          <HexColorPicker color={color} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
