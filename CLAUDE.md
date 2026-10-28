# Sistema Rody

Sistema simple de cotizaciones para Heladería Kokino, que vende helado por tacho: se elige el cliente, se cargan sabores y cantidades, y el sistema calcula la cotización automáticamente con la lista de precios que le corresponde (hoy se hace en Excel y se envía una foto del resultado).

## Agent skills

### Issue tracker

Las issues viven en GitHub Issues de `marianariccio123-svg/Sistema-Rody`. Ver `docs/agents/issue-tracker.md`.

### Triage labels

Se usan las cinco etiquetas por defecto (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). Ver `docs/agents/triage-labels.md`.

### Domain docs

Single-context: un `CONTEXT.md` y `docs/adr/` en la raíz. Ver `docs/agents/domain.md`.

## Publicar

Cada push a `claude/youthful-carson-jaomtm` dispara un deploy en Netlify, y el plan gratuito da 300 créditos por mes a 10 créditos por deploy. Por eso los cambios se prueban en la computadora y se publican en tandas:

1. Hacer el cambio y commitearlo local.
2. Correr `npm run probar` (pruebas, tipos, build y la versión construida en `http://localhost:4173`, también accesible desde el celular en la misma red wifi).
3. Pedir que se revise ahí.
4. Hacer `git push` solo cuando se pida explícitamente; varios commits revisados viajan juntos en un solo push.

Un push que solo cambia cosas que no van en la página (documentación, `.github/`, `supabase/`) lleva `[skip netlify]` en el mensaje del último commit: Netlify no lo construye y no gasta créditos.
