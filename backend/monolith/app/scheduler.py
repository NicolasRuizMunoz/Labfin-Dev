"""Background scheduler for recurring jobs (currently: MercadoPúblico daily sync).

Lifecycle is owned by `main.lifespan`. The scheduler runs in the same process as
FastAPI; with multiple uvicorn workers the cron would multi-fire, so this is gated
by `MP_SCHEDULER_ENABLED` and intended for single-worker deployments. For multi-
worker setups, externalize the cron and hit `/api/data/etiquetas/scrape/run`.
"""
from __future__ import annotations

import logging
from typing import Optional

from app.config import (
    MP_SCHEDULER_ENABLED,
    MP_SCHEDULER_HOUR,
    MP_SCHEDULER_TZ,
)
from app.database.db import get_db
from app.services import mercadopublico_service

logger = logging.getLogger(__name__)

_scheduler = None  # apscheduler.schedulers.background.BackgroundScheduler


def _run_daily_sync() -> None:
    logger.info("MP scheduler: starting daily sync")
    db = next(get_db())
    try:
        totals = mercadopublico_service.sincronizar_todas_las_orgs(db)
        logger.info("MP scheduler: done %s", totals)
    except Exception:
        logger.exception("MP scheduler: unhandled error")
    finally:
        db.close()


def start_scheduler() -> Optional[object]:
    global _scheduler
    if not MP_SCHEDULER_ENABLED:
        logger.info("MP_SCHEDULER_ENABLED=false — scheduler not started.")
        return None
    if _scheduler is not None:
        return _scheduler
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from apscheduler.triggers.cron import CronTrigger
    except ImportError:
        logger.warning("APScheduler not installed — scheduler disabled.")
        return None

    sched = BackgroundScheduler(timezone=MP_SCHEDULER_TZ)
    sched.add_job(
        _run_daily_sync,
        CronTrigger(hour=MP_SCHEDULER_HOUR, minute=0),
        id="mp_daily_sync",
        replace_existing=True,
    )
    sched.start()
    logger.info(
        "MP scheduler started — daily at %02d:00 %s",
        MP_SCHEDULER_HOUR, MP_SCHEDULER_TZ,
    )
    _scheduler = sched
    return sched


def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        try:
            _scheduler.shutdown(wait=False)
        except Exception:
            logger.exception("Error shutting down MP scheduler")
        _scheduler = None
