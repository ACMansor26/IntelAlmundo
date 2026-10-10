// Trama decorativa de arcos (deconstruccion del simbolo de la marca): naranja sobre
// el fondo oscuro. Manual de marca: solo en portadas y separadores, nunca detras de
// bloques de texto denso; por eso se usa unicamente en el acceso (login).
import React from 'react';

const RADIOS = [150, 250, 350, 450, 550, 650];

export default function TramaArcos() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Esquina inferior izquierda */}
      <circle cx="0" cy="800" r="150" fill="#EA6422" fillOpacity="0.12" />
      {RADIOS.map((r, i) => (
        <circle key={`a${r}`} cx="0" cy="800" r={r} fill="none" stroke="#EA6422" strokeWidth="26" strokeOpacity={0.26 - i * 0.035} />
      ))}
      {/* Esquina superior derecha */}
      <circle cx="1200" cy="0" r="150" fill="#EA6422" fillOpacity="0.1" />
      {RADIOS.map((r, i) => (
        <circle key={`b${r}`} cx="1200" cy="0" r={r} fill="none" stroke="#EA6422" strokeWidth="26" strokeOpacity={0.22 - i * 0.03} />
      ))}
    </svg>
  );
}
