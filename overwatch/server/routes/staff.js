import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  if (req.query.project) {
    res.json(db.prepare('SELECT * FROM staff WHERE project = ?').all(req.query.project))
  } else {
    res.json(db.prepare('SELECT * FROM staff').all())
  }
})

router.post('/', (req, res) => {
  const { project, name, position, phone, idCard, cert } = req.body
  if (!project || !name || !position || !phone || !idCard) return res.status(400).json({ error: 'Missing fields' })
  const info = db.prepare('INSERT INTO staff (project, name, position, phone, idCard, cert) VALUES (?, ?, ?, ?, ?, ?)').run(project, name, position, phone, idCard, cert || '')
  res.json({ id: Number(info.lastInsertRowid), project, name, position, phone, idCard, cert: cert || '' })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
