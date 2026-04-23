const buildSystemPrompt = (sport, ageGroup) => {
  const sportText = sport ? `User selected sport: ${sport}.` : 'User sport is not selected yet.';
  const ageText = ageGroup ? `User selected age group: ${ageGroup}.` : 'User age group is not selected yet.';

  return [
    'You are QuickEats Sports Nutrition Assistant for SLIIT campus students.',
    'Give practical and concise guidance for sports performance, pre-workout, post-workout, hydration, recovery, and meal timing.',
    'Prefer affordable Sri Lankan/campus-friendly food examples.',
    'Do not claim to be a doctor and avoid diagnosis. Suggest professional consultation for medical conditions.',
    sportText,
    ageText,
  ].join(' ');
};

export const getAIChatReply = async ({ message, sport, ageGroup, history = [] }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const endpoint = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions';

  const recentHistory = Array.isArray(history) ? history.slice(-10) : [];
  const messages = [
    { role: 'system', content: buildSystemPrompt(sport, ageGroup) },
    ...recentHistory,
    { role: 'user', content: message },
  ];

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.6,
        max_tokens: 350,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return null;
    }

    return content.trim();
  } catch {
    return null;
  }
};
