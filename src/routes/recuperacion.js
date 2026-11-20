
const router = require('express').Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { pool } = require('../db');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Solicitar recuperación de contraseña
router.post('/forgot-password', async (req, res) => {
  const email = String(req.body?.email || '').trim();

  if (!email) {
    return res.status(400).json({ error: 'Correo requerido' });
  }

  try {
    const [usuarios] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    // Respuesta idéntica para evitar revelar usuarios registrados.
    const mensaje = {
      mensaje: 'Si el correo está registrado, recibirás instrucciones.'
    };

    if (!usuarios.length) {
      return res.json(mensaje);
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER ||
        !process.env.SMTP_PASS) {
      return res.status(503).json({
        error: 'Servicio de correo no configurado'
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256')
      .update(token).digest('hex');

    const expira = new Date(Date.now() + 15 * 60 * 1000);

    const transportador = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await pool.query(
      `INSERT INTO recuperacion_password
       (usuario_id, token_hash, expira_en)
       VALUES (?, ?, ?)`,
      [usuarios[0].id, tokenHash, expira]
    );

    const enlace = `${FRONTEND_URL}/reset-password?token=${token}`;

    await transportador.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'SIGEM - Recuperación de contraseña',
      text: `Para restablecer tu contraseña, abre este enlace:
${enlace}

El enlace vence en 15 minutos.`
    });

    return res.json(mensaje);
  } catch (error) {
    console.error('Error en recuperación:', error.message);
    return res.status(500).json({
      error: 'No fue posible procesar la solicitud'
    });
  }
});

// Restablecer contraseña con token válido
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body || {};

  if (typeof token !== 'string' ||
      !/^[a-f0-9]{64}$/.test(token) ||
      typeof password !== 'string' ||
      password.length < 8) {
    return res.status(400).json({
      error: 'Token o contraseña inválidos'
    });
  }

  const hash = crypto.createHash('sha256')
    .update(token).digest('hex');

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    const [filas] = await conexion.query(
      `SELECT id, usuario_id
       FROM recuperacion_password
       WHERE token_hash = ?
         AND usado_en IS NULL
         AND expira_en > NOW()
       FOR UPDATE`,
      [hash]
    );

    if (!filas.length) {
      await conexion.rollback();
      return res.status(400).json({
        error: 'Enlace inválido o vencido'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await conexion.query(
      'UPDATE usuarios SET password_hash = ? WHERE id = ?',
      [passwordHash, filas[0].usuario_id]
    );

    await conexion.query(
      `UPDATE recuperacion_password
       SET usado_en = NOW()
       WHERE usuario_id = ? AND usado_en IS NULL`,
      [filas[0].usuario_id]
    );

    await conexion.commit();

    return res.json({
      mensaje: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    await conexion.rollback();
    console.error('Error al restablecer contraseña:', error.message);
    return res.status(500).json({
      error: 'No fue posible restablecer la contraseña'
    });
  } finally {
    conexion.release();
  }
});

module.exports = router;
