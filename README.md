# auth-service

Authentication and authorization service for the Exodus Rush game. Handles user login, JWT token generation, and session management.

## Overview

**Service Configuration:**
- **Technology:** Node.js, Express, JWT
- **Port:** 8083
- **Replicas:** 2

## Endpoints

### POST /login
Authenticate user and return JWT token.

**Request:**
```json
{
  "username": "test_user",
  "password": "passover2026"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "test_user",
    "email": "test@stealthymcstealth.com"
  }
}
```

### POST /logout
Invalidate current session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### GET /validate
Validate JWT token and return user info.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "test_user",
    "email": "test@stealthymcstealth.com"
  }
}
```

### POST /refresh
Refresh expired or expiring token.

**Headers:**
```
Authorization: Bearer <old_token>
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "auth-service"
}
```

## Test Users

For development/development environment:

| Username | Password | Email |
|----------|----------|-------|
| test_user | passover2026 | test@stealthymcstealth.com |
| moishe | deploy123 | moishe.deploy@stealthymcstealth.com |

## Deployment

```bash
# Build Docker image
docker build -t stealthymcstealth/exodus-rush-auth-service:latest .

# Push to registry
docker push stealthymcstealth/exodus-rush-auth-service:latest

# Deploy to Kubernetes
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Verify deployment
kubectl get pods -n passover -l app=auth-service
kubectl get svc -n passover auth-service
```

## Usage

Other services can validate tokens by calling:

```bash
curl -H "Authorization: Bearer <token>" http://auth-service:8083/validate
```

## Dependencies

- **PostgreSQL:** (Optional) For user account storage in production
- **Redis:** (Optional) For session management in production

Current implementation uses in-memory storage for simplicity.

## Environment Variables

- `PORT`: Service port (default: 8083)
- `JWT_SECRET`: Secret key for JWT signing (default: exodus-rush-secret-2026)
- `JWT_EXPIRES_IN`: Token expiration time (default: 24h)
- `NODE_ENV`: Environment (development/production)

## Security Notes

- In production, use proper secrets management (Kubernetes Secrets, Vault)
- Store JWT_SECRET securely, never commit to git
- Use HTTPS for all authentication endpoints
- Implement rate limiting on login endpoint
- Use Redis for distributed session storage with multiple replicas

**Note:** Current implementation uses test credentials for development environment only.

