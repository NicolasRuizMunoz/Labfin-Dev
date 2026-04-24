import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM

logger = logging.getLogger(__name__)

DEMO_RECIPIENT = "evaliticstech@gmail.com"


def send_demo_request_email(
    name: str,
    email: str,
    phone: str,
    description: str,
) -> None:
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP not configured — demo request from %s NOT sent", email)
        raise RuntimeError("SMTP not configured")

    subject = f"Nueva solicitud de demo – {name}"

    html = f"""\
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px">
  <h2 style="color:#2d7a4f;margin-bottom:16px">Nueva solicitud de demo</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr>
      <td style="padding:8px 12px;font-weight:bold;color:#444;border-bottom:1px solid #eee">Nombre</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">{name}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;font-weight:bold;color:#444;border-bottom:1px solid #eee">Correo</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">{email}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;font-weight:bold;color:#444;border-bottom:1px solid #eee">Teléfono</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">{phone or '—'}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;font-weight:bold;color:#444;vertical-align:top">Descripción</td>
      <td style="padding:8px 12px">{description or '—'}</td>
    </tr>
  </table>
  <p style="color:#999;font-size:12px;margin-top:24px">Enviado desde el formulario de demo de Evalitics.</p>
</div>"""

    plain = (
        f"Nueva solicitud de demo\n\n"
        f"Nombre: {name}\n"
        f"Correo: {email}\n"
        f"Teléfono: {phone or '—'}\n"
        f"Descripción: {description or '—'}\n"
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = DEMO_RECIPIENT
    msg["Reply-To"] = email
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM, DEMO_RECIPIENT, msg.as_string())

    logger.info("Demo request email sent for %s <%s>", name, email)
