# Complementos recomendados para Claude Code

## Recomendación de seguridad

Empieza con complementos oficiales y con skills locales incluidas en este repositorio. Una skill puede contener instrucciones y scripts con acceso a archivos o terminal; no instales colecciones masivas sin revisar su código, permisos, autor, actividad y dependencias.

## Marketplace oficial

Dentro de Claude Code:

```text
/plugin marketplace add anthropics/claude-plugins-official
/plugin marketplace update claude-plugins-official
```

## Complementos oficiales recomendados

```text
/plugin install skill-creator@claude-plugins-official
/plugin install frontend-design@claude-plugins-official
/plugin install code-review@claude-plugins-official
/reload-plugins
```

### Para qué sirve cada uno

- `skill-creator`: crear, evaluar y mejorar skills del proyecto.
- `frontend-design`: elevar la calidad visual y evitar interfaces genéricas.
- `code-review`: revisar pull requests con varios agentes especializados.

## Skill oficial adicional para pruebas web

La skill `webapp-testing` del repositorio oficial `anthropics/skills` sirve para probar aplicaciones locales con Playwright. Antes de copiarla, revisa los scripts y los permisos que necesita. El proyecto ya incluye una skill local de QA que obliga a usar Playwright y puede ser suficiente para comenzar.

## Skills locales incluidas

Claude Code descubre automáticamente las carpetas de `.claude/skills/`:

- `bakery-architecture`
- `bakery-ui-mobile`
- `bakery-security-rbac`
- `bakery-database-reports`
- `bakery-qa-release`

## Agentes locales incluidos

Claude Code descubre automáticamente `.claude/agents/`:

- `bakery-architect`
- `bakery-security-reviewer`
- `bakery-ux-reviewer`
- `bakery-qa-engineer`

Ejemplos de uso:

```text
Usa el agente bakery-architect para revisar el plan antes de implementar.
Usa el agente bakery-security-reviewer para auditar autenticación, RLS y enlaces públicos.
Usa el agente bakery-ux-reviewer para revisar la pantalla de conteo en 320 px y 390 px.
Usa el agente bakery-qa-engineer para diseñar y ejecutar las pruebas de la fase.
```
