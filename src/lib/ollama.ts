import { BudgetSuggestion, WizardCategory } from "./types";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

export async function getAIBudgetSuggestions(
  monthlyIncome: number,
  categories: WizardCategory[]
): Promise<BudgetSuggestion[]> {
  const prompt = `You are a personal finance advisor. Given a monthly income of ₪${monthlyIncome} and the following expense categories, suggest a reasonable budget for each category. The total of all monthly amounts must not exceed the monthly income. Leave some buffer for savings if not explicitly listed.

Categories:
${categories.map((c) => `- ${c.name} (${c.type})`).join("\n")}

For weekly categories, provide the PER-WEEK amount (not monthly total). For monthly categories, provide the monthly amount.
When calculating totals, multiply weekly amounts by 4.33 to get the monthly equivalent. The sum of all monthly equivalents must not exceed ₪${monthlyIncome}.

Return ONLY a valid JSON array of objects with fields: name (string), type ("weekly" or "monthly"), suggestedAmount (number, in shekels, no agorot — per-week for weekly categories, per-month for monthly categories).
Do not include any text before or after the JSON array.`;

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama request failed: ${res.status}`);
  }

  const data = await res.json();
  const responseText = data.response?.trim() || "";

  // Try to extract JSON array from the response
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Could not parse AI response as JSON array");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!Array.isArray(parsed)) {
    throw new Error("AI response is not an array");
  }

  return parsed.map((item: Record<string, unknown>) => ({
    name: String(item.name),
    type: item.type === "weekly" ? "weekly" : "monthly",
    suggestedAmount: Math.round(Number(item.suggestedAmount) || 0),
  }));
}

export function getFallbackSuggestions(
  monthlyIncome: number,
  categories: WizardCategory[]
): BudgetSuggestion[] {
  const perCategoryMonthly = Math.floor(monthlyIncome / (categories.length + 1)); // +1 for savings buffer
  return categories.map((c) => ({
    name: c.name,
    type: c.type,
    // For weekly categories, convert monthly share to per-week
    suggestedAmount: c.type === "weekly"
      ? Math.round(perCategoryMonthly / 4.33)
      : perCategoryMonthly,
  }));
}
