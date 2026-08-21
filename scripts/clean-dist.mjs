import { rm } from 'node:fs/promises'
import { basename, resolve, sep } from 'node:path'

const projectRoot = resolve(process.cwd())
const outputDirectory = resolve(projectRoot, 'dist')

if (basename(outputDirectory) !== 'dist' || !outputDirectory.startsWith(`${projectRoot}${sep}`)) {
  throw new Error('Refusing to clean an unexpected build directory.')
}

await rm(outputDirectory, { recursive: true, force: true })
