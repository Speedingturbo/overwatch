import { Router } from 'express'
import db from '../db.js'

const router = Router()

// List view: exclude photo blob to keep responses small
router.get('/', (req, res) => {
  if (req.query.project) {
    const rows = db.prepare('SELECT id, project, deviceName, checkContent, foundRisk, warrantyStatus, CASE WHEN photo IS NOT NULL AND photo != \'\' THEN 1 ELSE 0 END AS hasPhoto FROM device_inspections WHERE project = ?').all(req.query.project)
    res.json(rows)
    return
  }
  const rows = db.prepare('SELECT id, project, deviceName, checkContent, foundRisk, warrantyStatus, CASE WHEN photo IS NOT NULL AND photo != \'\' THEN 1 ELSE 0 END AS hasPhoto FROM device_inspections').all()
  res.json(rows)
})

// Get single record with full photo
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM device_inspections WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(row)
})

// Serve photo as an image directly
router.get('/:id/photo', (req, res) => {
  const row = db.prepare('SELECT photo FROM device_inspections WHERE id = ?').get(req.params.id)
  if (!row || !row.photo) return res.status(404).json({ error: 'No photo' })

  const photo = row.photo
  // If it's a base64 data URL, parse and send as image
  if (photo.startsWith('data:')) {
    const match = photo.match(/^data:(image\/[^;]+);base64,(.+)$/)
    if (!match) return res.status(500).json({ error: 'Invalid photo data' })
    const mime = match[1]
    const buf = Buffer.from(match[2], 'base64')
    res.setHeader('Content-Type', mime)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    return res.send(buf)
  }

  // Legacy: it's a file path like /uploads/xxx.jpg — redirect
  res.redirect(photo)
})

router.post('/', (req, res) => {
  const { project, deviceName, checkContent, foundRisk, warrantyStatus, photo } = req.body
  if (!project || !deviceName) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  // Store base64 data URL directly in DB (no filesystem dependency)
  const photoData = (typeof photo === 'string' && photo) ? photo : ''

  const info = db.prepare(
    'INSERT INTO device_inspections (project, deviceName, checkContent, foundRisk, warrantyStatus, photo) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(project, deviceName, checkContent || '', foundRisk || '', warrantyStatus || '', photoData)

  const id = Number(info.lastInsertRowid)
  res.json({
    id,
    project,
    deviceName,
    checkContent: checkContent || '',
    foundRisk: foundRisk || '',
    warrantyStatus: warrantyStatus || '',
    hasPhoto: photoData ? 1 : 0
  })
})

router.put('/:id', (req, res) => {
  const { deviceName, checkContent, foundRisk, warrantyStatus, photo } = req.body
  if (!deviceName) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  let photoData
  if (typeof photo === 'string' && photo !== '') {
    // New photo provided (base64 or legacy path)
    photoData = photo
  } else if (photo === null || photo === undefined) {
    // No photo field sent — keep existing
    const existing = db.prepare('SELECT photo FROM device_inspections WHERE id = ?').get(req.params.id)
    photoData = existing ? (existing.photo || '') : ''
  } else {
    // Empty string means clear photo
    photoData = ''
  }

  db.prepare(
    'UPDATE device_inspections SET deviceName = ?, checkContent = ?, foundRisk = ?, warrantyStatus = ?, photo = ? WHERE id = ?'
  ).run(deviceName, checkContent || '', foundRisk || '', warrantyStatus || '', photoData, req.params.id)

  const row = db.prepare('SELECT id, project, deviceName, checkContent, foundRisk, warrantyStatus, CASE WHEN photo IS NOT NULL AND photo != \'\' THEN 1 ELSE 0 END AS hasPhoto FROM device_inspections WHERE id = ?').get(req.params.id)
  res.json(row)
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM device_inspections WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
