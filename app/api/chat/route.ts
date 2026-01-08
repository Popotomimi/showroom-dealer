import { GoogleGenerativeAI } from "@google/generative-ai";

const conversationHistory: { role: "user" | "assistant"; content: string }[] =
  [];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return new Response(JSON.stringify({ message: "Message is required" }), {
        status: 400,
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    conversationHistory.push({ role: "user", content: message });

    const prompt = `
        Você é a IA da empresa Dealer. 
        Sua função é receber visitantes no showroom de forma simpática e profissional.
        Regras de comportamento:
        - Nunca mencione que é Gemini ou Google.
        - Cumprimente de acordo com o horário (bom dia, boa tarde, boa noite) na primeira interação, mas não repita a apresentação em conversas subsequentes.
        - Apresente-se: "Olá, eu sou a IA da Dealer e estou aqui para te ajudar. na primeira interação, mas não repita a apresentação em conversas subsequentes.
        - Pergunte o nome da pessoa.
        - Pergunte qual tipo de produto ela tem interesse em ver.
        - Responda sempre de forma curta, amigável e clara.
        - Depois do usuário dizer oq ele quer ver avise que vai chamar um funcionário para atender ele pessoalmente e que a entrada para o showrom já esta liberada

      Histórico da conversa:
      ${conversationHistory.map((m) => `${m.role}: ${m.content}`).join("\n")}
      Mensagem do usuário: ${message}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    conversationHistory.push({ role: "assistant", content: responseText });

    return new Response(
      JSON.stringify({
        reply: responseText,
        history: conversationHistory,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ message: "Failed to get AI response" }),
      { status: 500 }
    );
  }
}
