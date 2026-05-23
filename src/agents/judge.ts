import OpenAI from "openai";

export async function evaluatePR(
  diff: string,
  architectureDocs: string,
  apiKey: string
): Promise<string> {
  const client = new OpenAI({ apiKey });

  const systemPrompt = `You are PR-Griller, a strict but fair Expert Software Architect.
Evaluate the provided code diff against the provided architecture rules.
You must assign a Grill Score at the top of your response: 🥩 Raw (major violations), 🍔 Medium (some issues, mostly good), or 🍳 Well Done (perfectly aligns with architecture).
Provide concise, actionable suggestions for any violations, referencing specific lines or files if possible.`;

  const userPrompt = `Diff:\n${diff}\n\nArchitecture Rules:\n${architectureDocs}`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("OpenAI did not return a valid text response.");
    }

    return content.trim();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown OpenAI error.";
    throw new Error(`OpenAI evaluation failed: ${message}`);
  }
}
