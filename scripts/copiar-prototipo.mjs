// Mientras el sistema nuevo no tenga la pantalla de cotización (#4), el prototipo sigue publicado en /prototipo/.
import { cpSync } from 'node:fs';

cpSync('prototype/cotizacion', 'dist/prototipo', { recursive: true });
