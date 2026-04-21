import { Router } from 'express'
import db, { saveBase64Photo } from '../db.js'

const router = Router()

function toFrontend(row) {
  return {
    id: row.id,
    project: row.project,
    desc: row.description,
    discoverTime: row.discoverTime,
    discoverPlace: row.discoverPlace,
    level: row.level,
    photo: row.photo,
    measure: row.measure
  }
}

router.get('/', (req, res) => {
  let sql = 'SELECT * FROM risks'
  const params = []
  const conds = []
  if (req.query.project) { conds.push('project = ?'); params.push(req.query.project) }
  if (req.query.level) { conds.push('level = ?'); params.push(req.query.level) }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ')
  const rows = db.prepare(sql).all(...params)
  res.json(rows.map(toFrontend))
})

router.post('/', (req, res) => {
  const { project, desc, discoverTime, discoverPlace, level, photo, measure } = req.body
  if (!project || !desc || !level) return res.status(400).json({ error: 'Missing fields' })
  const savedPhoto = saveBase64Photo(photo)
  const info = db.prepare(
    'INSERT INTO risks (project, description, discoverTime, discoverPlace, level, photo, measure) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(project, desc, discoverTime || '', discoverPlace || '', level, savedPhoto, measure || '')
  res.json({ id: Number(info.lastInsertRowid), project, desc, discoverTime: discoverTime || '', discoverPlace: discoverPlace || '', level, photo: savedPhoto, measure: measure || '' })
})

router.put('/:id', (req, res) => {
  const { desc, discoverTime, discoverPlace, level, photo, measure } = req.body
  if (!desc || !level) return res.status(400).json({ error: 'Missing fields' })
  const savedPhoto = saveBase64Photo(photo)
  db.prepare(
    'UPDATE risks SET description = ?, discoverTime = ?, discoverPlace = ?, level = ?, photo = ?, measure = ? WHERE id = ?'
  ).run(desc, discoverTime || '', discoverPlace || '', level, savedPhoto, measure || '', req.params.id)
  const row = db.prepare('SELECT * FROM risks WHERE id = ?').get(req.params.id)
  res.json(toFrontend(row))
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM risks WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
