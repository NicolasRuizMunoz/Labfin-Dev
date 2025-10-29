# Evalitics Data Service

## Overview
This service is a FastAPI-based microservice responsible for handling data-related operations in the Evalitics platform. It manages file uploads, batch processing, tender analysis, and file management, and coordinates with other services using Celery for asynchronous tasks and N8N for workflow automation.

## Main Workflow
1. **File Upload**: Users upload files via the `/upload` endpoint. Files are staged and then confirmed for processing.
2. **Batch Management**: Uploaded files can be grouped into batches using `/upload/batch` endpoints. Batches are used for collective analysis and processing.
3. **File Management**: The `/file` endpoints allow users to list, set active, delete, and generate download URLs for their files.
4. **Tender Analysis**: The `/tenders` endpoints manage tender-related data and trigger analysis workflows.
5. **Analysis**: The `/analysis` endpoints start and receive results from analysis processes, often triggered by batch or tender actions.

## API Endpoints
- `/upload`: Stage and confirm file uploads.
- `/upload/batch`: Create, list, modify, and delete batches of files.
- `/file`: List, delete, set active, and download files.
- `/tenders`: List tenders, start analysis, and receive results.
- `/analysis`: Start analysis and receive results.

## Service Interactions
- **Celery**: Used for background task processing (e.g., file processing after upload confirmation). The worker is configured in `celery_worker.py` and tasks are defined in `tasks/`.
- **N8N**: External workflow automation tool. Webhook URLs and credentials are configured in `config.py` and used to trigger or receive results from N8N workflows.
- **Database**: Uses SQLAlchemy and MySQL for persistent storage of files, batches, tenders, and analysis results.
- **AWS S3**: For file storage and retrieval, configured via environment variables in `config.py`.

## Bringing a New Developer Up to Speed
- **Start the Service**: Run the FastAPI app (`main.py`) and Celery worker (`celery_worker.py`). Ensure environment variables are set (see `.env` and `config.py`).
- **Explore Endpoints**: Review routers in `routers/` for available API endpoints and their logic.
- **Understand Task Flow**: File uploads trigger Celery tasks for processing. Batch and tender actions may trigger analysis workflows via N8N.
- **Configuration**: All secrets, database, and external service URLs are managed in `.env` and loaded by `config.py`.
- **Dependencies**: Install required packages from `requirements.txt`.

## Directory Structure
- `main.py`: FastAPI app entry point and router registration.
- `celery_worker.py`: Celery worker setup.
- `config.py`: Configuration and environment variable loading.
- `routers/`: API endpoint definitions.
- `services/`: Business logic for file, batch, tender, and analysis operations.
- `tasks/`: Celery task definitions.
- `models/`: SQLAlchemy models.
- `utils/`: Helper functions.

## Useful Commands
- Start FastAPI: `uvicorn main:app --reload 8001`
- Start Celery worker: `python celery_worker.py`

---
For more details, review the code in each module and the comments in the routers and services.
