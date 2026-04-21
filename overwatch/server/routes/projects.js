import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM projects').all()
  res.json(rows)
})

router.post('/', (req, res) => {
  const { name, progress } = req.body
  if (!name) return res.status(400).json({ error: 'Missing name' })
  const p = Number(progress) || 0
  const info = db.prepare('INSERT INTO projects (name, progress) VALUES (?, ?)').run(name, p)
  res.json({ id: Number(info.lastInsertRowid), name, progress: p })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
