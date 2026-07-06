# Reglas para opencode

## Git
- No hacer commit, push, ni ninguna operación de git a menos que el usuario lo solicite explícitamente.
- No crear ramas ni hacer merges sin autorización.

## Proceso de commit, push y PR

Cuando el usuario solicite explícitamente hacer commit y push:

1. **Crear rama**: Crear una rama nueva desde `main` con nombre descriptivo (`feat/`, `fix/`, `refactor/`, etc.)
2. **Staging**: Agregar los archivos relevantes con `git add` (excluir archivos temporales como PLAN_*.md)
3. **Commit**: Mensaje descriptivo en español, explicando qué cambió y por qué
4. **Push**: `git push origin <nombre-rama>`
5. **PR**: Crear pull request a `main` usando `gh pr create` con:
   - Título descriptivo
   - Body con lista de cambios y endpoint verificados si aplica
   - `Closes #<issue>` si resuelve un issue
