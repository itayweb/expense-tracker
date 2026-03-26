import { getAIBudgetSuggestions, getFallbackSuggestions } from "@/lib/ollama";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { monthlyIncome, categories, existingAmounts } = body;

  try {
    const suggestions = await getAIBudgetSuggestions(
      monthlyIncome,
      categories
    );
    return NextResponse.json({ suggestions, source: "ai" });
  } catch (error) {
    console.error("Ollama error, using fallback:", error);
    const suggestions = getFallbackSuggestions(monthlyIncome, categories, existingAmounts);
    return NextResponse.json({ suggestions, source: "fallback" });
  }
}
