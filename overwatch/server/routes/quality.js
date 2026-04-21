import { Router } from 'express'
import db, { saveBase64Photo } from '../db.js'

const router = Router()

function toFrontend(row) {
  return {
    id: row.id,
    project: row.project,
    date: row.date,
    rebar: { photo: row.rebarPhoto, content: row.rebarContent },
    wiring: { photo: row.wiringPhoto, content: row.wiringContent },
    equipment: { photo: row.equipmentPhoto, content: row.equipmentContent }
  }
}

router.get('/', (req, res) => {
  if (req.query.project) {
    const rows = db.prepare('SELECT * FROM quality WHERE project = ?').all(req.query.project)
    res.json(rows.map(toFrontend))
  } else {
    const rows = db.prepare('SELECT * FROM quality').all()
    res.json(rows.map(toFrontend))
  }
})

router.post('/', (req, res) => {
  const { project, date, rebarPhoto, rebarContent, wiringPhoto, wiringContent, equipmentPhoto, equipmentContent } = req.body
  if (!project) return res.status(400).json({ error: 'Missing project' })
  const rp = saveBase64Photo(rebarPhoto)
  const wp = saveBase64Photo(wiringPhoto)
  const ep = saveBase64Photo(equipmentPhoto)
  const info = db.prepare(
    'INSERT INTO quality (project, date, rebarPhoto, rebarContent, wiringPhoto, wiringContent, equipmentPhoto, equipmentContent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(project, date || '', rp, rebarContent || '', wp, wiringContent || '', ep, equipmentContent || '')
  const row = db.prepare('SELECT * FROM quality WHERE id = ?').get(Number(info.lastInsertRowid))
  res.json(toFrontend(row))
})

router.put('/:id', (req, res) => {
  const { rebarPhoto, rebarContent, wiringPhoto, wiringContent, equipmentPhoto, equipmentContent } = req.body
  const rp = saveBase64Photo(rebarPhoto)
  const wp = saveBase64Photo(wiringPhoto)
  const ep = saveBase64Photo(equipmentPhoto)
  db.prepare(
    'UPDATE quality SET rebarPhoto = ?, rebarContent = ?, wiringPhoto = ?, wiringContent = ?, equipmentPhoto = ?, equipmentContent = ? WHERE id = ?'
  ).run(rp, rebarContent || '', wp, wiringContent || '', ep, equipmentContent || '', req.params.id)
  const row = db.prepare('SELECT * FROM quality WHERE id = ?').get(req.params.id)
  res.json(toFrontend(row))
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM quality WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
