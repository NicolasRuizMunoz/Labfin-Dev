import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM

logger = logging.getLogger(__name__)


def send_reset_code_email(to_email: str, code: str) -> None:
    """Send a password-reset code via SMTP.  Fails silently so we never reveal whether the email exists."""
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP not configured — reset code for %s NOT sent", to_email)
        return

    subject = "Tu código de recuperación – LabFin"
    html = f"""\
<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
  <h2 style="color:#6366f1">Recuperación de contraseña</h2>
  <p>Usa el siguiente código para restablecer tu contraseña. Expira en 15 minutos.</p>
  <div style="font-size:32px;letter-spacing:8px;font-weight:bold;text-align:center;
              padding:16px;background:#f4f4f5;border-radius:8px;margin:24px 0">
    {code}
  </div>
  <p style="color:#71717a;font-size:13px">Si no solicitaste este cambio, ignora este correo.</p>
</div>"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(f"Tu código de recuperación es: {code}", "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())
        logger.info("Reset code email sent to %s", to_email)
    except Exception:
        logger.exception("Failed to send reset code email to %s", to_email)
