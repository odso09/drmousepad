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
