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
    measure: row.measure,
    processed: Boolean(row.processed),
    workflowStep: row.workflowStep || 0,
    confirmPhoto: row.confirmPhoto || '',
    confirmDesc: row.confirmDesc || '',
    rollbackReason: row.rollbackReason || ''
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
  const { project, desc, discoverTime, discoverPlace, level, photo, measure, processed } = req.body
  if (!project || !desc || !level) return res.status(400).json({ error: 'Missing fields' })
  const savedPhoto = saveBase64Photo(photo)
  const info = db.prepare(
    'INSERT INTO risks (project, description, discoverTime, discoverPlace, level, photo, measure, processed, workflowStep) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)'
  ).run(project, desc, discoverTime || '', discoverPlace || '', level, savedPhoto, measure || '', processed ? 1 : 0)
  res.json({ id: Number(info.lastInsertRowid), project, desc, discoverTime: discoverTime || '', discoverPlace: discoverPlace || '', level, photo: savedPhoto, measure: measure || '', processed: Boolean(processed), workflowStep: 0 })
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

router.put('/:id/process', (req, res) => {
  const processed = req.body?.processed ? 1 : 0
  db.prepare('UPDATE risks SET processed = ? WHERE id = ?').run(processed, req.params.id)
  const row = db.prepare('SELECT * FROM risks WHERE id = ?').get(req.params.id)
  res.json(toFrontend(row))
})

// Workflow steps: 0=未发起 1=监理工程师已发起 2=施工班组长已确认 3=施工经理已复核 4=监理工程师最终确认
const WORKFLOW_ROLE_MAP = {
  1: '监理工程师',
  2: '施工班组长',
  3: '项目经理',
  4: '监理工程师'
}

router.put('/:id/workflow', (req, res) => {
  const { step, userRole, confirmPhoto, confirmDesc } = req.body
  console.log('[workflow] id=%s step=%s role=%s hasConfirmPhoto=%s confirmDescLen=%s',
    req.params.id, step, userRole, !!confirmPhoto, (confirmDesc || '').length)
  if (!step || !userRole) return res.status(400).json({ error: 'Missing step or userRole' })
  const row = db.prepare('SELECT * FROM risks WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  const currentStep = row.workflowStep || 0
  if (step !== currentStep + 1) return res.status(400).json({ error: '流程步骤不正确' })
  if (WORKFLOW_ROLE_MAP[step] !== userRole) return res.status(403).json({ error: '无权限执行此步骤' })
  if (step === 2) {
    const photoData = (typeof confirmPhoto === 'string' && confirmPhoto) ? confirmPhoto : ''
    console.log('[workflow] saving step2 confirmPhoto len=%s confirmDesc=%s', photoData.length, confirmDesc)
    db.prepare('UPDATE risks SET workflowStep = ?, confirmPhoto = ?, confirmDesc = ?, rollbackReason = ? WHERE id = ?')
      .run(step, photoData, confirmDesc || '', '', req.params.id)
  } else if (step === 4) {
    db.prepare('UPDATE risks SET workflowStep = ?, processed = 1, rollbackReason = ? WHERE id = ?').run(step, '', req.params.id)
  } else {
    db.prepare('UPDATE risks SET workflowStep = ?, rollbackReason = ? WHERE id = ?').run(step, '', req.params.id)
  }
  const updated = db.prepare('SELECT * FROM risks WHERE id = ?').get(req.params.id)
  res.json(toFrontend(updated))
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM risks WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// 施工班组长编辑整改信息（仅允许 workflowStep === 2）
router.put('/:id/confirm', (req, res) => {
  const { confirmPhoto, confirmDesc, userRole } = req.body
  if (userRole !== '施工班组长') return res.status(403).json({ error: '无权限' })
  const row = db.prepare('SELECT * FROM risks WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  if (row.workflowStep !== 2) return res.status(400).json({ error: '只能在步骤2编辑整改信息' })
  const photoData = (typeof confirmPhoto === 'string' && confirmPhoto) ? confirmPhoto : (row.confirmPhoto || '')
  db.prepare('UPDATE risks SET confirmPhoto = ?, confirmDesc = ? WHERE id = ?')
    .run(photoData, confirmDesc !== undefined ? confirmDesc : (row.confirmDesc || ''), req.params.id)
  const updated = db.prepare('SELECT * FROM risks WHERE id = ?').get(req.params.id)
  res.json(toFrontend(updated))
})

// 退回流程到上一步（管理员、项目经理、监理工程师）
router.put('/:id/rollback', (req, res) => {
  const { userRole, isAdmin } = req.body
  const allowed = isAdmin || userRole === '项目经理' || userRole === '监理工程师'
  if (!allowed) return res.status(403).json({ error: '无权限退回流程' })
  const row = db.prepare('SELECT * FROM risks WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  const currentStep = row.workflowStep || 0
  if (currentStep === 0) return res.status(400).json({ error: '流程尚未开始，无法退回' })
  // 非管理员只能退回自己权限范围内的步骤
  if (!isAdmin) {
    if (userRole === '项目经理' && currentStep < 2) {
      return res.status(403).json({ error: '项目经理只能在步骤2或3时退回' })
    }
    if (userRole === '监理工程师' && currentStep < 1) {
      return res.status(403).json({ error: '监理工程师只能在流程进行中退回' })
    }
  }
  const reason = req.body.rollbackReason || ''
  if (!isAdmin) {
    if (userRole === '项目经理') {
      // 无论在步骤2还是3，都退回至步骤1并清除施工班组长的确认信息
      db.prepare("UPDATE risks SET workflowStep = 1, confirmPhoto = '', confirmDesc = '', rollbackReason = ? WHERE id = ?").run(reason, req.params.id)
    } else if (userRole === '监理工程师') {
      if (currentStep === 1) {
        // 退回至步骤0
        db.prepare('UPDATE risks SET workflowStep = 0, rollbackReason = ? WHERE id = ?').run(reason, req.params.id)
      } else if (currentStep === 2) {
        // 取消施工班组长确认，退回至步骤1
        db.prepare("UPDATE risks SET workflowStep = 1, confirmPhoto = '', confirmDesc = '', rollbackReason = ? WHERE id = ?").run(reason, req.params.id)
      } else if (currentStep === 3) {
        // 取消项目经理复核，退回至步骤2
        db.prepare('UPDATE risks SET workflowStep = 2, rollbackReason = ? WHERE id = ?').run(reason, req.params.id)
      } else if (currentStep === 4) {
        // 取消项目经理复核及最终确认，退回至步骤2
        db.prepare('UPDATE risks SET workflowStep = 2, processed = 0, rollbackReason = ? WHERE id = ?').run(reason, req.params.id)
      }
    }
  } else {
    // 管理员：单步退回
    const prevStep = currentStep - 1
    if (currentStep === 2) {
      db.prepare("UPDATE risks SET workflowStep = ?, confirmPhoto = '', confirmDesc = '', rollbackReason = ? WHERE id = ?").run(prevStep, reason, req.params.id)
    } else if (currentStep === 4) {
      db.prepare('UPDATE risks SET workflowStep = ?, processed = 0, rollbackReason = ? WHERE id = ?').run(prevStep, reason, req.params.id)
    } else {
      db.prepare('UPDATE risks SET workflowStep = ?, rollbackReason = ? WHERE id = ?').run(prevStep, reason, req.params.id)
    }
  }
  const updated = db.prepare('SELECT * FROM risks WHERE id = ?').get(req.params.id)
  res.json(toFrontend(updated))
})

export default router
