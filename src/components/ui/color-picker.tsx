import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";

export function ColorPicker({ color, onChange }: { color: string; onChange: (color: string) => void }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const size = 40;

  useEffect(() => {
    if (!show) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [show]);

  return (
    <div ref={ref} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <button
        type="button"
        aria-label="Elegir color de texto"
        onClick={() => setShow((v) => !v)}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: "2px solid #a78bfa",
          background: color,
          cursor: "pointer",
          boxShadow: show ? '0 0 0 3px #a78bfa55' : undefined,
          transition: 'box-shadow 0.2s',
        }}
      />
      {show && (
        <div style={{ position: "absolute", zIndex: 10, top: size + 8, left: '50%', transform: 'translateX(-50%)' }}>
          <HexColorPicker color={color} onChange={onChange} style={{ width: 180, height: 180, borderRadius: '50%' }} />
        </div>
      )}
    </div>
  );
}
