export function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function contemTodasPalavras(frase: string, grupo: string[]): boolean {
  return grupo.every((palavra: string) => frase.includes(palavra));
}
