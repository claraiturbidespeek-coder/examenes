/**
 * Los cuatro pasos de las instrucciones.
 *
 * Son cuatro y la cuadrícula que los pinta cuenta con ello: reparte el alto en
 * dos filas de dos. Con otro número quedaría una fila coja o de más.
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
import type { StaticImageData } from "next/image";

import recurso1 from "@/public/plantilla/recurso1.webp";
import recurso2 from "@/public/plantilla/recurso2.webp";
import recurso3 from "@/public/plantilla/recurso3.webp";
import recurso4 from "@/public/plantilla/recurso4.webp";

export type InstructionStep = {
  title: string;
  body: string;
  /**
   * Ilustración del paso. Se importa en vez de referenciarse por ruta para que
   * el ancho y el alto reales viajen con ella —y para que renombrar un archivo
   * rompa el build en vez de dejar un hueco en producción.
   *
   * Es decorativa: va con alt vacío porque el título y el cuerpo ya dicen todo
   * lo que la imagen ilustra, y repetirlo solo alarga lo que oye un lector de
   * pantalla.
   */
  image: StaticImageData;
};

export const INSTRUCTION_STEPS: InstructionStep[] = [
  {
    title: "Duración del examen",
    body: "El examen es adaptativo: las preguntas se ajustan a tus respuestas y se detiene automáticamente en cuanto identifica tu nivel. No tiene un número fijo de preguntas.",
    image: recurso1,
  },
  {
    title: "Ambiente tranquilo",
    body: "Busca un sitio sin ruido ni interrupciones. Vas a necesitar escuchar con claridad, así que usa auriculares si los tienes a mano.",
    image: recurso2,
  },
  {
    title: "Una sola exhibición",
    body: "El examen se completa en una única sesión, de principio a fin. No se puede pausar y retomar más tarde, así que asegúrate de disponer del rato entero antes de empezar.",
    image: recurso3,
  },
  {
    title: "Dispositivo compatible",
    body: "Hazlo desde un ordenador con conexión estable. No es compatible con tablets ni teléfonos móviles.",
    image: recurso4,
  },
];
