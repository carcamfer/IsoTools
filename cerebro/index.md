---
title: Índice del cerebro de IsoTools
updated: 2026-06-28
---

# 🧠 Cerebro de IsoTools

Memoria viva de las **tools ISO** y de **cómo se comunican entre sí**. Empieza por aquí.

> Antes de tocar tu tool: abre su nota en [tools/](tools/), mira con quién se comunica y lee la bitácora de cada [comunicación](comunicaciones/). Ahí ves qué cambió el otro programador.

## Cómo está organizado

- **[tools/](tools/)** — una nota por tool (125). Qué hace, qué consume/produce, con quién habla, su bitácora de cambios.
- **[comunicaciones/](comunicaciones/)** — una nota por contrato tool↔tool (90). El payload, la condición de disparo, la rama git y la **bitácora de la comunicación**.
- **[agentes/](agentes/)** — una nota por agente (13). Agrupa las tools que lo componen.

## Reglas del vault

- Schema de operación: [[CLAUDE]]
- Bitácora del vault: [[log]]

## Flujo rápido para un programador

1. **Te asignan una tool.** Sigue el roadmap en `../pasos/` (paso 1 → 9).
2. **Ubica tu tool** en [tools/](tools/) y mira sus comunicaciones.
3. **Crea tu rama:** `npm run rama:comm <source>__<target>`.
4. **Implementa** y, en cada cambio de contrato, **anota en la bitácora** de la nota de comunicación.
5. **PR a `feature/filter`** cuando el contrato quede estable.

## Estado actual

- Tools implementadas (con handler): **16** (paquete de calidad ISO 9001).
- Tools en catálogo (sin handler aún): **109**.
- Comunicaciones declaradas: **90**.

> Regenera/actualiza este vault con `npm run cerebro:generar` cuando agregues tools o reglas.
