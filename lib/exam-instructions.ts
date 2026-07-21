/**
 * Los cuatro pasos del carrusel de instrucciones.
 *
 * Son fijos: iguales para todos los clientes y todos los idiomas. No dependen de
 * exam_pages, así que no se guardan en base de datos.
 *
 * OJO — REDACCIÓN PENDIENTE DE VALIDAR. Los títulos vienen del wireframe; los
 * cuerpos están redactados a partir de esos títulos y de las notas del propio
 * wireframe, no copiados del sitio actual de S-Peak. Hay que contrastarlos con
 * las instrucciones reales antes de publicar: si alguna afirmación aquí no se
 * corresponde con cómo funciona el examen (por ejemplo si sí se puede pausar, o
 * si sí hay tiempo límite), el alumno recibe información falsa.
 */
export type InstructionStep = {
  title: string;
  body: string;
};

export const INSTRUCTION_STEPS: InstructionStep[] = [
  {
    title: "Duración del examen",
    body: "El examen es adaptativo: las preguntas se ajustan a tus respuestas y se detiene automáticamente en cuanto identifica tu nivel. No tiene un número fijo de preguntas.",
  },
  {
    title: "Ambiente tranquilo",
    body: "Busca un sitio sin ruido ni interrupciones. Vas a necesitar escuchar con claridad, así que usa auriculares si los tienes a mano.",
  },
  {
    title: "Una sola exhibición",
    body: "El examen se completa en una única sesión, de principio a fin. No se puede pausar y retomar más tarde, así que asegúrate de disponer del rato entero antes de empezar.",
  },
  {
    title: "Dispositivo compatible",
    body: "Hazlo desde un ordenador con conexión estable. No es compatible con tablets ni teléfonos móviles.",
  },
];
