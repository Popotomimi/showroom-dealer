import { GoogleGenerativeAI } from "@google/generative-ai";

// Usamos let para poder resetar o histórico
let conversationHistory: { role: "user" | "assistant"; content: string }[] = [];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, reset } = body;

    // Se vier reset, limpa o histórico e retorna
    if (reset) {
      conversationHistory = [];
      return new Response(
        JSON.stringify({ message: "Histórico resetado com sucesso!" }),
        { status: 200 }
      );
    }

    if (!message) {
      return new Response(JSON.stringify({ message: "Message is required" }), {
        status: 400,
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Adiciona a mensagem do usuário ao histórico
    conversationHistory.push({ role: "user", content: message });

    const prompt = `
      Você é a IA da empresa Dealer. 
      Sua função é receber visitantes no showroom de forma simpática e profissional.
      Nossos produtos: 
      - Vigilância Inteligente (câmeras de segurança com análise por IA)
      - Vigilância Smart City (para monitoramento urbano)
      - Vigilância para Agro (fazendas e áreas rurais)
      - Vigilância para Condomínios (residenciais e comerciais)
      - Vigilância para Indústria (equipamentos industriais)
      - Vigilância para Comércio (Varejo e lojas)
      Regras de interação:
      - Responda apenas em português.
      - Nunca mencione que é Gemini ou Google.
      - Cumprimente de acordo com o horário (bom dia, boa tarde, boa noite) na primeira interação, mas não repita a apresentação em conversas subsequentes.
      - Apresente-se: "Olá, eu sou a IA da Dealer e estou aqui para te ajudar." na primeira interação, mas não repita a apresentação em conversas subsequentes.
      - Pergunte o nome da pessoa.
      - Pergunte qual tipo de produto ela tem interesse em ver.
      - Responda sempre de forma curta, amigável e clara.
      - Depois do usuário dizer o que ele quer ver, avise que vai chamar os consultores Giba e Alan para atender ele pessoalmente e que a entrada para o showroom já está liberada, vá até a catraca e passe pelo reconhecimento facial.

      Histórico da conversa:
      ${conversationHistory.map((m) => `${m.role}: ${m.content}`).join("\n")}
      Mensagem do usuário: ${message}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Adiciona a resposta da IA ao histórico
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
