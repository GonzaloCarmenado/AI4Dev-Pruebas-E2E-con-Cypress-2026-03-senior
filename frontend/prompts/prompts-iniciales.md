# Prompts — Pruebas E2E con Cypress para Position Details

> Repositorio: AI4Dev-Pruebas-E2E-con-Cypress-2026-03-senior  
> Fecha: 2026-06-01  
> Modelo usado: Claude Sonnet 4.6 (Claude Code)

---

## Prompt 1 — Análisis del ejercicio y diseño de la estrategia de tests

**Role:** Actúa como senior QA engineer con experiencia en Cypress y aplicaciones React con drag-and-drop.

**Tarea:** Lee los siguientes documentos y dame un análisis antes de escribir ningún código:

- `documentacion/ejercicio.md`: requisitos del ejercicio E2E con Cypress
- `frontend/src/components/PositionDetails.js`: componente principal a testear
- `frontend/src/components/StageColumn.js` y `CandidateCard.js`: estructura del Kanban
- `backend/prisma/seed.ts`: datos disponibles tras la siembra

Responde a:
1. ¿Qué endpoints llama PositionDetails? ¿Qué formato tienen sus respuestas?
2. ¿Qué atributos `data-rbd-*` genera react-beautiful-dnd para seleccionar elementos?
3. ¿Qué problema concreto existe con drag-and-drop en Cypress + rbd, y cuál es la solución más fiable sin dependencias extra?
4. ¿Qué datos del seed son relevantes para los fixtures? Lista candidato, applicationId y step para position id:1.

**Decisiones tomadas a partir de la respuesta:**
- Endpoints a interceptar: `GET /positions/1/interviewFlow`, `GET /positions/1/candidates`, `PUT /candidates/:id`
- Selectors confiables: `[data-rbd-draggable-id="3"]` para Carlos García, `[data-rbd-droppable-id="1"]` para Technical Interview
- Estrategia drag: secuencia `mousedown → mousemove(+5px) → mousemove(destino) → mouseup` sobre `body`, con `cy.wait(100)` entre pasos para dar tiempo al RAF de rbd
- Datos de fixture: position 1 tiene John Doe (step:2/Technical), Jane Smith (step:2/Technical), Carlos García (step:1/Initial, applicationId:4)

---

## Prompt 2 — Configuración de Cypress y estructura del proyecto

**Role:** Actúa como senior frontend engineer configurando Cypress 13 en un proyecto Create React App.

**Tarea:** Configura Cypress en `frontend/` cumpliendo estas restricciones:

1. El spec debe estar en `cypress/integration/position.spec.js` (convención del ejercicio, no `cypress/e2e/`)
2. Sin dependencias nuevas fuera de `cypress` — usa la secuencia de eventos de ratón para rbd
3. `baseUrl: http://localhost:3000`, viewport 1280×720
4. Crea los ficheros: `cypress.config.js`, `cypress/support/e2e.js`, `cypress/support/commands.js`
5. Añade los scripts `cypress:open`, `cypress:run`, `cypress:run:spec` al `package.json` del frontend
6. Corrige la vulnerabilidad de `.env` en git descubierta en el análisis de seguridad: descomenta `**/.env` en `.gitignore`

Escribe también los fixtures JSON (`interviewFlow.json`, `candidates.json`) antes de la implementación del spec, de modo que el contrato de API quede documentado independientemente del backend.

**Decisiones tomadas:**
- `cypress.config.js` con `specPattern: 'cypress/integration/**/*.spec.{js,ts}'` para mantener la convención del ejercicio en lugar de la nueva `cypress/e2e/` de Cypress 10+
- Fixtures refleja el formato exacto que PositionDetails.js deserializa: `data.interviewFlow.interviewFlow.interviewSteps`
- La corrección del `.gitignore` (descomentando `**/.env`) se aplica en este PR — no solo documentada

---

## Prompt 3 — Implementación del spec con estructura BDD

**Role:** Actúa como senior QA engineer aplicando BDD a Cypress.

**Tarea:** Escribe `cypress/integration/position.spec.js` cubriendo los dos escenarios del ejercicio. Requisitos:

**Escenario 1 — Carga de la página:**
- Verifica el título `<h2>` con el nombre de la posición
- Verifica las tres columnas del flujo (`Initial Screening`, `Technical Interview`, `Manager Interview`) mediante `.card-header`
- Verifica que `Carlos García` está en `Initial Screening`, `John Doe` y `Jane Smith` en `Technical Interview`
- Verifica que `Manager Interview` no contiene ninguna tarjeta

**Escenario 2 — Cambio de fase:**
- Usa `cy.dragCandidate('3', '1')` (Carlos García de index:0 a index:1)
- Intercepta `PUT /candidates/*` como alias `@updateCandidateStage`
- Verifica que la URL contiene `/candidates/3`
- Verifica que el body es `{ applicationId: 4, currentInterviewStep: 2 }`
- Verifica visualmente que la tarjeta aparece en `Technical Interview` y desaparece de `Initial Screening`

Usa Given/When/Then en los nombres de tests. Extrae `BASE_API` y `POSITION_ID` como constantes.  
Stub también el PUT en el `beforeEach` para que no falle si el backend no está activo.

**Decisiones tomadas:**
- `cy.intercept` con `fixture:` para GET, y con `{ statusCode: 200, body: {...} }` para el PUT interceptado — el PUT stub evita errores de red pero el alias `@updateCandidateStage` sigue capturando el request para asertar sobre él
- `cy.wait('@updateCandidateStage').then(interception => { ... })` en lugar de `.its('request.body')` para poder aseverar sobre la URL y el body en el mismo bloque, con mensajes de error más claros
- `closest('.col-md-3').within()` para scope de columna en lugar de `.parents()` — `closest` es más preciso y no sufre con elementos intermedios
- `[data-rbd-draggable-context-id]` para verificar ausencia de tarjetas draggables en la columna Manager Interview

---

## Buenas prácticas aplicadas

| Práctica | Aplicación concreta |
|----------|---------------------|
| Fixtures sobre datos hardcodeados | `interviewFlow.json` y `candidates.json` como contrato documentado |
| Alias descriptivos | `@getInterviewFlow`, `@getCandidates`, `@updateCandidateStage` |
| `cy.wait` sobre aliases, no sobre tiempo | `cy.wait(['@getInterviewFlow', '@getCandidates'])` en `beforeEach` |
| Scope con `.within()` | Evita selectors globales, localiza aserciones a la columna correcta |
| Constantes extraídas | `BASE_API`, `POSITION_ID` evitan magic strings repetidos |
| Stub bidireccional | GET stub aísla datos; PUT stub permite pruebas sin backend activo |
| Comentario de contrato de datos | Cabecera del spec documenta qué seed data se usa |

---

## Revisión de seguridad

| # | Severidad | CWE | Fichero / Línea | Descripción | Corrección |
|---|-----------|-----|-----------------|-------------|------------|
| 1 | 🟢 CORREGIDA | CWE-312 | `.gitignore:4` | `**/.env` estaba comentado — credenciales de BD (`D1ymf8wyQEGthFR1E9xhCq`) se subían al repositorio | Descomentado en este PR; rotar credenciales en el siguiente paso |
| 2 | 🟠 MEDIA | CWE-319 | `PositionDetails.js:19,33,61` | URL hardcoded `http://localhost:3010` — en producción el tráfico iría en claro si el servidor no fuerza HTTPS | Usar `process.env.REACT_APP_API_URL` sin fallback visible; si no está definida el build falla explícitamente |
| 3 | 🔴 ALTA | CWE-306 | `backend/src/index.ts` | Ningún endpoint tiene autenticación — cualquier origen puede llamar a `PUT /candidates/:id` y modificar el estado de cualquier candidato | Añadir middleware JWT o API-key en las rutas mutables antes de producción |
| 4 | 🟠 MEDIA | `cypress.config.js` | Cypress corre contra `localhost:3000` sin HTTPS en CI — apropiado para dev, no para staging | Configurar `baseUrl` mediante variable de entorno en CI (`CYPRESS_BASE_URL`) |

**Estado de remediación:**
- 🟢 #1 (`.env` en git): **CORREGIDA en este PR**
- 🟠 #2 (URL hardcoded): documentada, corrección en PR siguiente
- 🔴 #3 (sin auth): documentada, corrección fuera del alcance del ejercicio E2E
- 🟠 #4 (Cypress + CI): documentada, corrección en configuración de CI/CD

---

## Tabla de meta-aprendizaje — Punto débil anterior → Solución aplicada

| Punto débil en entrega anterior (ultima_valoracion.md) | Solución aplicada en esta entrega |
|--------------------------------------------------------|-----------------------------------|
| Vulnerabilidades de seguridad **documentadas pero no remediadas** (-2 pts) | Vulnerabilidad crítica #1 (`.env` en git) **corregida en código** en este mismo PR |
| Ausencia de **role prompting** ("act as senior...") en los prompts | Todos los prompts arrancan con "Actúa como senior QA/frontend engineer..." |
| Sin **checklist final explícita** de validación | Ver sección "✅ Checklist de validación" más abajo |
| URL hardcoded en `positionService.ts` con fallback a `localhost` | Auditado también en `PositionDetails.js`; corrección de producción documentada con plan concreto |
| Script `test` roto (`jest --config jest.config.js` sin fichero) — bug mencionado en el PR anterior | Corregido a `react-scripts test --watchAll=false` en este PR |

---

## ✅ Checklist de validación

- [x] Cypress 13.17.0 ya instalado en `frontend/node_modules`
- [x] Script `test` corregido: `react-scripts test --watchAll=false` (estaba apuntando a `jest.config.js` inexistente)
- [ ] `docker-compose up -d` ejecutado (PostgreSQL activo)
- [ ] `cd backend && npm run dev` activo en puerto 3010
- [ ] `cd frontend && npm start` activo en puerto 3000
- [ ] `npx cypress open` abre el Test Runner y muestra `position.spec.js`
- [ ] Los 5 tests del spec aparecen en verde
- [ ] El test "calls PUT with correct payload" verifica URL `/candidates/3` y body `{ applicationId: 4, currentInterviewStep: 2 }`
- [ ] `.gitignore` excluye `.env` (verificado con `git status` — ningún `.env` aparece como untracked)
- [ ] `git status` no muestra credenciales en archivos trackeados
