import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "crm-app",
    timestamp: new Date().toISOString()
  });
}
