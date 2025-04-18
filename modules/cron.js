/**
 * @fileoverview FlynCodes Universal Design - Cron jobs manager
 * @version 3
 * @date 2025-03-18
 * @author FlynCodes {@link https://flyn.codes|FlynCodes website}
 * @license Proprietary. All Rights Reserved © 2025 Flyn.
 * @description This file is for organisations, companies, non-profits, and projects FlynCodes is involved in, ensuring a universal and consistent approach with best practices across all projects.
 */

import { Cron } from 'croner'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const options = { catch: false, protect: true }
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class CronClass {
  constructor() {
    this.jobs = []
  }

  start(cronjobsDir) {
    fs.readdirSync(path.join(__dirname, '../', cronjobsDir)).forEach(async fileName => {
      if ((!fileName.endsWith('.js') && !fileName.endsWith('.ts')) || fileName.endsWith('.d.ts')) return
      const file = await import(pathToFileURL(path.join(__dirname, '../', cronjobsDir, fileName)).href).then(module => module.default || module)
      if (file.interval === undefined || file.job === undefined) return
      const job = new Cron(file.interval, options, file.job)
      this.jobs.push({ name: fileName, job })
    })
  }

  destroy() {
    this.jobs.forEach(({ job }) => job.stop())
    this.jobs = []
  }

  add(name, interval, func) {
    if (name === undefined || interval === undefined || func === undefined) return
    const job = new Cron(interval, options, func)
    this.jobs.push({ name, job })
  }

  async addFile(filePath) {
    const fileName = path.basename(filePath)
    const file = await import(pathToFileURL(filePath).href).then(module => module.default || module)
    if (file.interval === undefined || file.job === undefined) return
    const job = new Cron(file.interval, options, file.job)
    this.jobs.push({ name: fileName, job })
  }

  remove(name) {
    const index = this.jobs.findIndex(job => job.name === name)
    if (index === -1) return
    this.jobs[index].job.stop()
    this.jobs.splice(index, 1)
  }
}
export { CronClass as Cron }
