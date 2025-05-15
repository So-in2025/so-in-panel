# Control de versiones con Git

Este proyecto utiliza Git para el control de versiones. A continuación tienes los pasos básicos:

1. Inicializar un repositorio Git (solo una vez):
   ```bash
   cd /ruta/al/proyecto
   git init
   ```

2. Agregar archivos al área de staging:
   ```bash
   git add .
   ```

3. Realizar el commit inicial:
   ```bash
   git commit -m "Initial project refactor and audit integration"
   ```

4. Crear ramas para nuevas funcionalidades o correcciones:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

5. Después de terminar, unir la rama en `main`:
   ```bash
   git checkout main
   git merge feature/nueva-funcionalidad
   ```

6. Uso de etiquetas (tags) para marcar versiones:
   ```bash
   git tag -a v1.0.0 -m "Versión 1.0.0 audit y refactor completo"
   ```

7. Subir a un repositorio remoto (por ejemplo, GitHub o GitLab):
   ```bash
   git remote add origin https://github.com/tu-usuario/tu-repo.git
   git push -u origin main --tags
   ```

_Sugerencia:_ Cada vez que inicies una nueva tarea o bugfix, crea una rama descriptiva siguiendo el formato `feature/`, `bugfix/` o `hotfix/` para mantener el historial ordenado.
