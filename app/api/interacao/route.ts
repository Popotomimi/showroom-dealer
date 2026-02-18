import { NextRequest } from "next/server";
import { connectMongo } from "../../../lib/mongodb";
import Interacao from "../../../models/Interacao";

export async function POST(req: NextRequest) {
  try {
    const { nome, produto, dataHora } = await req.json();
    await connectMongo();
    await Interacao.create({
      nome,
      produto,
      dataHora: dataHora ? new Date(dataHora) : new Date(),
    });
    return new Response(JSON.stringify({ ok: true }), { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: err }), {
      status: 500,
    });
  }
}
