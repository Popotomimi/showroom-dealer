import { NextRequest, NextResponse } from "next/server";
import DigestFetch from "digest-fetch";

export async function GET(req: NextRequest) {
  const OPEN_URL = process.env.OPEN_URL!;
  const USER_NAME = process.env.USER_NAME!;
  const PASSWORD = process.env.PASSWORD!;

  const client = new DigestFetch(USER_NAME, PASSWORD);

  try {
    const response = await client.fetch(OPEN_URL, { method: "GET" });
    const text = await response.text();
    return NextResponse.json({ success: true, data: text });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error?.toString() },
      { status: 500 },
    );
  }
}
