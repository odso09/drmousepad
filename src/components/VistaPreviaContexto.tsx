import React from "react";

// Props: dataUrl = imagen del mousepad exportada desde el canvas
//         mockupUrl = imagen de fondo (escritorio, etc)
//         pos/size = posición y tamaño del mousepad sobre el mockup
export function VistaPreviaContexto({
  dataUrl,
  mockupUrl = "/mockups/desk-mockup-demo.jpg",
  left = 120,
  top = 220,
  width = 400,
  rotation = -3,
  perspective = 400,
  skewY = 2,
}) {
  return (
    <div style={{ position: "relative", width: 800, height: 500, background: "#222", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 32px #0005" }}>
      {/* Barra superior visual */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: 56,
        background: 'linear-gradient(90deg, #0f172a 60%, #181c2a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 10,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
      }}>
        <span style={{ color: '#cbd5e1', fontWeight: 700, fontSize: 20, letterSpacing: 0.2 }}>Vista Previa</span>
        <span style={{ color: '#cbd5e1', fontWeight: 500, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          Color de fondo:
          <span style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '2.5px solid #a78bfa',
            boxShadow: '0 0 0 2px #7c3aed, 0 2px 8px 0 rgba(0,0,0,0.18)',
            display: 'inline-block',
            marginLeft: 8,
            background: 'radial-gradient(circle at 30% 30%, #a78bfa 60%, #181c2a 100%)',
          }} />
        </span>
      </div>
      <img src={mockupUrl} alt="Mockup escritorio" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <img
        src={dataUrl}
        alt="Vista previa mousepad"
        style={{
          position: "absolute",
          left,
          top,
          width,
          boxShadow: "0 2px 16px #0007",
          borderRadius: 12,
          transform: `rotate(${rotation}deg) perspective(${perspective}px) skewY(${skewY}deg)`,
          transition: "all .3s cubic-bezier(.4,2,.6,1)",
        }}
      />
    </div>
  );
}

// Uso sugerido:
// <VistaPreviaContexto dataUrl={mousepadDataUrl} />
// Puedes ajustar left/top/width/rotation según el mockup que uses.
