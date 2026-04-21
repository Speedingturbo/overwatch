import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  if (req.query.project) {
    res.json(db.prepare('SELECT * FROM supervisors WHERE project = ?').all(req.query.project))
  } else {
    res.json(db.prepare('SELECT * FROM supervisors').all())
  }
})

router.post('/', (req, res) => {
  const { project, name, phone } = req.body
  if (!project || !name || !phone) return res.status(400).json({ error: 'Missing fields' })
  const info = db.prepare("INSERT INTO supervisors (project, name, phone, attendance, lastCheckIn) VALUES (?, ?, ?, 0, '')").run(project, name, phone)
  res.json({ id: Number(info.lastInsertRowid), project, name, phone, attendance: 0, lastCheckIn: '' })
})

router.put('/:id/checkin', (req, res) => {
  const { today } = req.body
  const row = db.prepare('SELECT * FROM supervisors WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  if (row.lastCheckIn === today) return res.json(row)
  db.prepare('UPDATE supervisors SET attendance = attendance + 1, lastCheckIn = ? WHERE id = ?').run(today, req.params.id)
  res.json({ ...row, attendance: row.attendance + 1, lastCheckIn: today })
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM supervisors WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
