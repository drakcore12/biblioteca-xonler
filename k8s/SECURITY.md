# Seguridad en Kubernetes

## ⚠️ IMPORTANTE: Protección de Secrets

Los archivos `secrets.yaml` contienen información sensible y **NO deben versionarse** en Git.

## Estructura de Archivos

- `secrets.yaml.example` - Template con valores de ejemplo (SÍ se versiona)
- `secrets.yaml` - Secrets reales (NO se versiona, está en `.gitignore`)

## Configuración Inicial

### 1. Crear secrets.yaml desde el template

```bash
# Linux/Mac
cp k8s/secrets.yaml.example k8s/secrets.yaml

# Windows PowerShell
Copy-Item k8s/secrets.yaml.example k8s/secrets.yaml
```

### 2. Editar secrets.yaml con valores reales

**IMPORTANTE:** Todos los valores deben estar codificados en **base64**.

#### Codificar valores en base64

**Linux/Mac:**
```bash
echo -n "tu-password" | base64
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("tu-password"))
```

**Generar JWT_SECRET seguro:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 3. Aplicar los secrets

```bash
kubectl apply -f k8s/secrets.yaml
```

## Valores que DEBES cambiar en Producción

- ✅ `DB_PASSWORD` - Contraseña de PostgreSQL
- ✅ `POSTGRES_PASSWORD` - Contraseña de PostgreSQL
- ✅ `JWT_SECRET` - Secret para JWT (generar uno seguro)
- ✅ `ENCRYPTION_PASSWORD` - Contraseña de encriptación
- ✅ `ENCRYPTION_SALT` - Salt de encriptación
- ✅ `GRAFANA_ADMIN_PASSWORD` - Contraseña de Grafana
- ✅ `PGADMIN_DEFAULT_PASSWORD` - Contraseña de pgAdmin

## Mejores Prácticas para Producción

### Opción 1: Sealed Secrets (Recomendado)

Sealed Secrets encripta los Secrets usando una clave pública. Solo el cluster puede desencriptarlos.

**Instalación:**
```bash
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml
```

**Uso:**
```bash
# Instalar kubeseal
# Crear SealedSecret
kubectl create secret generic app-secrets --from-file=secrets.yaml -o yaml --dry-run=client | kubeseal -o yaml > sealed-secret.yaml
```

### Opción 2: External Secrets Operator

Sincroniza secrets desde sistemas externos (AWS Secrets Manager, HashiCorp Vault, etc.)

**Instalación:**
```bash
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets -n external-secrets-system --create-namespace
```

### Opción 3: HashiCorp Vault

Sistema completo de gestión de secrets.

**Documentación:** https://www.vaultproject.io/

## Verificación de Seguridad

### Verificar que secrets.yaml no está en Git

```bash
git ls-files | grep secrets.yaml
# No debe aparecer nada
```

### Verificar que está en .gitignore

```bash
git check-ignore k8s/secrets.yaml
# Debe mostrar: k8s/secrets.yaml
```

## Rotación de Secrets

Si un secret se compromete, sigue estos pasos:

1. **Generar nuevos valores:**
   ```bash
   # Generar nuevo JWT_SECRET
   openssl rand -base64 32
   ```

2. **Actualizar secrets.yaml:**
   - Codificar nuevos valores en base64
   - Actualizar el archivo

3. **Aplicar cambios:**
   ```bash
   kubectl apply -f k8s/secrets.yaml
   ```

4. **Reiniciar pods afectados:**
   ```bash
   kubectl rollout restart deployment/app-deployment -n biblioteca-xonler
   ```

## Acceso a Secrets en el Cluster

Los Secrets en Kubernetes se almacenan en **etcd** (puede estar encriptado en reposo).

**Verificar encriptación de etcd:**
```bash
kubectl get encryptionconfig -n kube-system
```

## Recursos Adicionales

- [Kubernetes Secrets Documentation](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [External Secrets Operator](https://external-secrets.io/)
- [HashiCorp Vault](https://www.vaultproject.io/)

