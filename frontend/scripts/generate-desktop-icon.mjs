import { mkdir, copyFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pngToIco from "png-to-ico"

const currentFilePath = fileURLToPath(import.meta.url)
const currentDirPath = path.dirname(currentFilePath)
const projectRoot = path.resolve(currentDirPath, "..")
const sourcePngPath = path.join(projectRoot, "public", "jio-bp.png")
const buildResourcesPath = path.join(projectRoot, "build-resources")
const outputIcoPath = path.join(buildResourcesPath, "app-icon.ico")
const outputPngPath = path.join(buildResourcesPath, "app-icon.png")

await mkdir(buildResourcesPath, { recursive: true })

const icoBuffer = await pngToIco(sourcePngPath)

await writeFile(outputIcoPath, icoBuffer)
await copyFile(sourcePngPath, outputPngPath)

console.log(`Desktop icon generated at ${outputIcoPath}`)
