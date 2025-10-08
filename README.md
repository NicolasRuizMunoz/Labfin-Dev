# Inicialiaciond el proyecto

## Frontend

```bash
cd /frontend
npm install 
npm run dev
```

## Backend

1. Preparar ambiente

```bash
cd backend
python -m venv venv #si no esta el ambiente virtual creado.
venv\Scripts\activate
pip install -r requirements-all.txt
```

1. api_gateway

```bash
cd api_gateway
uvicorn app.main:app --reload --port 8000
```

2. Auth_Service

```bash
cd services/auth_service
uvicorn app.main:app --reload --port 8001
```