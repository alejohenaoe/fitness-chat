# Reglas para opencode

## Git
- No hacer commit, push, ni ninguna operación de git a menos que el usuario lo solicite explícitamente.
- No crear ramas ni hacer merges sin autorización.

## AWS — Despliegue en producción

Cuando el usuario diga **"desplegar en AWS"** o similar, seguir estos pasos:

### 1. Preparar el código
```bash
# Crear tarball excluyendo lo innecesario
tar czf /tmp/fitnesschat.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.DS_Store' \
  -C /Users/alejandrohenaoecheverri/Desktop/Proyectos/fitness-chat .
```

### 2. Enviar clave SSH via EC2 Instance Connect (válida 60s)
```bash
aws ec2-instance-connect send-ssh-public-key \
  --instance-id i-083a4872727bac672 \
  --availability-zone us-east-1d \
  --instance-os-user ubuntu \
  --ssh-public-key "$(ssh-keygen -y -f ~/.ssh/fitnesschat-deploy-v2.pem)"
```
> ⚠️ La clave pública expira a los 60 segundos. Los comandos ssh/scp deben ejecutarse inmediatamente después.

### 3. Copiar el código al servidor
```bash
scp -i ~/.ssh/fitnesschat-deploy-v2.pem -o StrictHostKeyChecking=no \
  /tmp/fitnesschat.tar.gz ubuntu@54.80.173.229:~/fitnesschat.tar.gz
```

### 4. Extraer y reconstruir en el EC2 (todo en un solo ssh)
```bash
ssh -i ~/.ssh/fitnesschat-deploy-v2.pem ubuntu@54.80.173.229 << 'ENDSSH'
  # Backup del deploy anterior
  rm -rf ~/fitnesschat-old
  mv ~/fitnesschat ~/fitnesschat-old
  mkdir -p ~/fitnesschat

  # Extraer código nuevo
  tar xzf ~/fitnesschat.tar.gz -C ~/fitnesschat

  # Restaurar .env.prod del backup (no se versiona)
  cp ~/fitnesschat-old/.env.prod ~/fitnesschat/.env.prod

  # Reconstruir y arrancar containers
  cd ~/fitnesschat
  docker compose -f docker-compose-prod.yml down
  docker compose -f docker-compose-prod.yml up -d --build
ENDSSH
```

### 5. Invalidar caché de CloudFront
```bash
aws cloudfront create-invalidation --distribution-id EDBCG728QIMTU --paths "/*"
```

### 6. Verificar el deploy
```bash
# Reenviar clave SSH (la anterior expiró)
aws ec2-instance-connect send-ssh-public-key \
  --instance-id i-083a4872727bac672 \
  --availability-zone us-east-1d \
  --instance-os-user ubuntu \
  --ssh-public-key "$(ssh-keygen -y -f ~/.ssh/fitnesschat-deploy-v2.pem)"

# Revisar containers y HTTP local
ssh -i ~/.ssh/fitnesschat-deploy-v2.pem ubuntu@54.80.173.229 \
  "docker ps --format 'table {{.Names}}\t{{.Status}}' && \
   curl -s -o /dev/null -w 'HTTP %{http_code}\n' http://localhost/"

# Verificar frontend y service worker via CloudFront
curl -s -o /dev/null -w 'HTTP %{http_code}' https://dvvavq17191yf.cloudfront.net/
curl -s -o /dev/null -w 'sw.js HTTP %{http_code}' https://dvvavq17191yf.cloudfront.net/sw.js
```

### 7. Commit y push de los cambios
```bash
git add -A
git commit -m "descripción de los cambios"
git push
```

### Notas importantes
- La clave SSH es `~/.ssh/fitnesschat-deploy-v2.pem` — fue creada con `aws ec2 create-key-pair` y guardada localmente. No está en el repo.
- `.env.prod` no se versiona (ignorado en `.gitignore`). Contiene `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` con el dominio de CloudFront, y las API keys. Se respalda en `~/fitnesschat-old/` durante el deploy.
- La instancia EC2 es `i-083a4872727bac672` (us-east-1d), tipo `t2.micro`, con Docker Compose.
- CloudFront distribution ID `EDBCG728QIMTU`, dominio `dvvavq17191yf.cloudfront.net`. Apunta al EC2 como origin.
- Si se crea una nueva instancia, generar nueva key pair y actualizar las variables en `.env`.
