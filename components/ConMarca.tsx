// Manual de marca: el nombre se escribe "Almundo", nunca "ALMUNDO". Dentro de textos
// con `uppercase` (etiquetas de KPI, subtitulos) el CSS lo convertiria a mayusculas;
// este componente protege solo esa palabra con `normal-case`.
import React from 'react';

export default function ConMarca({ texto }: { texto: string }) {
  const partes = texto.split(/(Almundo)/g);
  return (
    <>
      {partes.map((p, i) =>
        p === 'Almundo' ? (
          <span key={i} className="normal-case">
            Almundo
          </span>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </>
  );
}
