import { Router } from 'express'
import db, { saveBase64Photo } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  if (req.query.project) {
    const rows = db.prepare('SELECT * FROM device_inspections WHERE project = ?').all(req.query.project)
    res.json(rows)
    return
  }

  const rows = db.prepare('SELECT * FROM device_inspections').all()
  res.json(rows)
})

router.post('/', (req, res) => {
  const { project, deviceName, checkContent, foundRisk, warrantyStatus, photo } = req.body
  if (!project || !deviceName) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  const photoPath = saveBase64Photo(photo || '')

  const info = db.prepare(
    'INSERT INTO device_inspections (project, deviceName, checkContent, foundRisk, warrantyStatus, photo) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(project, deviceName, checkContent || '', foundRisk || '', warrantyStatus || '', photoPath)

  const row = db.prepare('SELECT * FROM device_inspections WHERE id = ?').get(Number(info.lastInsertRowid))
  res.json(row)
})

router.put('/:id', (req, res) => {
  const { deviceName, checkContent, foundRisk, warrantyStatus, photo } = req.body
  if (!deviceName) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  const existing = db.prepare('SELECT photo FROM device_inspections WHERE id = ?').get(req.params.id)
  const photoPath = photo ? saveBase64Photo(photo) : (existing ? existing.photo : '')

  db.prepare(
    'UPDATE device_inspections SET deviceName = ?, checkContent = ?, foundRisk = ?, warrantyStatus = ?, photo = ? WHERE id = ?'
  ).run(deviceName, checkContent || '', foundRisk || '', warrantyStatus || '', photoPath, req.params.id)

  const row = db.prepare('SELECT * FROM device_inspections WHERE id = ?').get(req.params.id)
  res.json(row)
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM device_inspections WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
