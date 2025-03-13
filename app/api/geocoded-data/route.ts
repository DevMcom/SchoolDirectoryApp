import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "geocoded-addresses.json")

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Geocoded data file not found" }, { status: 404 })
    }

    const data = fs.readFileSync(filePath, "utf8")
    const geocodedData = JSON.parse(data)

    return NextResponse.json(geocodedData)
  } catch (error) {
    console.error("Error loading geocoded data:", error)
    return NextResponse.json({ error: "Failed to load geocoded data" }, { status: 500 })
  }
}

