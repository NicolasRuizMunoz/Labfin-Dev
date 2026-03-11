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
python -m venv venv
venv\Scripts\activate

```

```bash
cd monolith
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```


admin@labfin.dev
admin123