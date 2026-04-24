const hydrationTargets = {
  swimming: '3.5 – 4.5 L',
  cycling: '3.5 – 4.5 L',
  rugby: '3.0 – 4.0 L',
  football: '3.0 – 4.0 L',
  default: '2.5 – 3.5 L',
};

const sportSpecificTips = {
  football: ['Prioritize carbs before training and protein after matches.', 'Add electrolytes for sessions longer than 60 minutes.'],
  basketball: ['Use small carb snacks before games to sustain quick bursts.', 'Recover with milk + eggs within 30 minutes.'],
  swimming: ['Split meals into smaller portions to keep energy stable.', 'Rehydrate consistently even when you do not feel sweaty.'],
  athletics: ['Increase carb portions before intense track sessions.', 'Use banana and chocolate milk for quick post-run recovery.'],
  cricket: ['Eat lighter meals before batting and fielding blocks.', 'Keep hydration steady between overs.'],
  badminton: ['Take quick carbs between rounds for fast recovery.', 'Support joints with calcium and omega-3 rich foods.'],
  volleyball: ['Focus on protein after jump-heavy training.', 'Hydrate between each set to maintain power output.'],
  rugby: ['Target high-protein meals for muscle repair.', 'Do not skip calories on contact training days.'],
  tennis: ['Use digestible carbs pre-match to avoid heaviness.', 'Bring bananas and fluids courtside for long matches.'],
  gym: ['Aim for high protein and progressive calorie intake.', 'Distribute protein across 4-5 meals each day.'],
  cycling: ['Carb-load before long rides above 2 hours.', 'Use fast carbs during long climbs to avoid energy drops.'],
  martial_arts: ['Keep protein high while staying lean.', 'Avoid heavy meals too close to sparring sessions.'],
};

const sportKeywords = {
  football: ['football', 'soccer'],
  basketball: ['basketball'],
  swimming: ['swimming', 'swim', 'swimmer'],
  athletics: ['athletics', 'running', 'runner', 'sprinter'],
  cricket: ['cricket', 'cricketer'],
  badminton: ['badminton'],
  volleyball: ['volleyball'],
  rugby: ['rugby'],
  tennis: ['tennis'],
  gym: ['gym', 'bodybuilding', 'weight training'],
  cycling: ['cycling', 'cyclist', 'bike'],
  martial_arts: ['martial arts', 'karate', 'taekwondo', 'boxing'],
};

const mealExamples = {
  football: 'pre-match meal: rice + chicken + dhal + banana',
  basketball: 'pre-game meal: rice + eggs + yogurt + fruit',
  swimming: 'pre-session meal: oats + milk + banana',
  cricket: 'pre-match meal: rice + fish/chicken + vegetables',
  default: 'balanced plate: rice/roti + protein + vegetables + fruit',
};

const normalizeText = (value = '') =>
  value
    .toLowerCase()
    .replace(/[.?!,;:\-_/()[\]{}'"`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const answerBank = [
  {
    id: 1,
    patterns: ['hello', 'hi', 'hey', 'good morning', 'good evening'],
    answer: 'Hi! I can help with meal plans, pre-workout meals, post-workout recovery, hydration, calories, macros, and match-day nutrition.',
  },
  {
    id: 2,
    patterns: ['what is a pre workout meal', 'pre workout meal', 'before training', 'before workout'],
    answer: 'A good pre-workout meal is easy to digest and carb-based: banana, toast, oats, rice, or yogurt. Avoid oily or very spicy food close to training.',
  },
  {
    id: 3,
    patterns: ['football training', 'football before', 'soccer before', 'football pre workout'],
    answer: 'For football, eat 2–3 hours before training: rice + chicken + dhal + fruit. If training is soon, take banana or toast instead.',
  },
  {
    id: 4,
    patterns: ['cricket match', 'cricket before', 'batting', 'cricket pre workout'],
    answer: 'For cricket, keep the meal light before play: rice + fish or chicken + vegetables. Add fruit or coconut water for energy and hydration.',
  },
  {
    id: 5,
    patterns: ['post workout', 'after training', 'recovery'],
    answer: 'Post-workout recovery should combine carbs + protein within 20–30 minutes. Good options are milk + banana, eggs + bread, or rice + lean protein.',
  },
  {
    id: 6,
    patterns: ['hydration', 'water', 'drink', 'fluids'],
    answer: 'Hydrate all day, not only during training. A practical target is about 2.5–4.0 L per day depending on sport, plus extra fluids during sessions.',
  },
  {
    id: 7,
    patterns: ['calorie', 'kcal', 'energy target', 'daily calories'],
    answer: 'Athletes need enough energy to train and recover. Calories should match sport intensity, body size, and age group; do not cut calories too aggressively.',
  },
  {
    id: 8,
    patterns: ['protein', 'how much protein', 'protein target'],
    answer: 'Protein should be spread across the day: breakfast, lunch, dinner, and snacks. Aim for eggs, milk, yogurt, chicken, fish, dhal, or soy foods.',
  },
  {
    id: 9,
    patterns: ['carb', 'carbohydrate', 'energy food', 'fuel'],
    answer: 'Carbs are the main fuel for training. Use rice, roti, bread, oats, bananas, potatoes, and fruits before and after exercise.',
  },
  {
    id: 10,
    patterns: ['fat loss', 'lose weight', 'cut weight', 'slim down'],
    answer: 'For fat loss, use a small calorie deficit, keep protein high, and still eat carbs around training so performance stays strong.',
  },
  {
    id: 11,
    patterns: ['muscle gain', 'bulk', 'gain muscle', 'build muscle'],
    answer: 'For muscle gain, eat a small calorie surplus, train hard, and include protein at every main meal with carbs around workouts.',
  },
  {
    id: 12,
    patterns: ['match day', 'game day', 'competition day'],
    answer: 'On match day, eat a main meal 2–3 hours before, take a light snack before the game, sip water often, and recover right after the match.',
  },
  {
    id: 13,
    patterns: ['breakfast', 'morning meal', 'first meal'],
    answer: 'A strong athlete breakfast can be oats, eggs, toast, fruit, or rice-based dishes. Breakfast should give energy, not make you feel heavy.',
  },
  {
    id: 14,
    patterns: ['lunch', 'midday meal'],
    answer: 'Lunch should be balanced: rice or roti, a protein source, vegetables, and fruit. This helps maintain energy for afternoon training.',
  },
  {
    id: 15,
    patterns: ['dinner', 'night meal', 'evening meal'],
    answer: 'Dinner should help recovery: rice or roti with fish, chicken, dhal, vegetables, and yogurt or curd if available.',
  },
  {
    id: 16,
    patterns: ['snack', 'snacks', 'quick bite'],
    answer: 'Good sports snacks include banana, yogurt, nuts, boiled eggs, peanut butter toast, dates, and fruit smoothies.',
  },
  {
    id: 17,
    patterns: ['supplement', 'creatine', 'whey', 'protein powder'],
    answer: 'Supplements are optional. Food first is best. Creatine and whey can help, but they should be used carefully and with guidance from a coach or professional.',
  },
  {
    id: 18,
    patterns: ['vegetarian', 'vegan', 'plant based', 'no meat'],
    answer: 'Vegetarian athletes can still perform well with dhal, chickpeas, soy, milk, yogurt, eggs, peanuts, beans, rice, and vegetables.',
  },
  {
    id: 19,
    patterns: ['full day meal', 'one day meal', 'daily meal plan', 'full meal plan'],
    answer: 'A full athlete day should include breakfast, lunch, dinner, 2–3 snacks, pre-workout fuel, post-workout recovery, and steady hydration.',
  },
  {
    id: 20,
    patterns: ['suggest', 'tip', 'advice', 'what should i eat'],
    answer: 'My top advice: eat enough, time meals around training, drink water regularly, and choose simple campus-friendly foods you can repeat daily.',
  },
];

const exactQuestionBank = [
  {
    question: 'What should I eat before football training?',
    answer: 'For football, eat 2–3 hours before training: rice + chicken + dhal + fruit. If training is soon, take banana or toast instead.',
  },
  {
    question: 'What is the best pre workout meal?',
    answer: 'A good pre-workout meal is easy to digest and carb-based: banana, toast, oats, rice, or yogurt. Avoid oily or very spicy food close to training.',
  },
  {
    question: 'What should cricket players eat before a match?',
    answer: 'For cricket, keep the meal light before play: rice + fish or chicken + vegetables. Add fruit or coconut water for energy and hydration.',
  },
  {
    question: 'What should I eat after training?',
    answer: 'Post-workout recovery should combine carbs + protein within 20–30 minutes. Good options are milk + banana, eggs + bread, or rice + lean protein.',
  },
  {
    question: 'How much water should I drink daily?',
    answer: 'Hydrate all day, not only during training. A practical target is about 2.5–4.0 L per day depending on sport, plus extra fluids during sessions.',
  },
  {
    question: 'How many calories do athletes need?',
    answer: 'Athletes need enough energy to train and recover. Calories should match sport intensity, body size, and age group; do not cut calories too aggressively.',
  },
  {
    question: 'How much protein do athletes need?',
    answer: 'Protein should be spread across the day: breakfast, lunch, dinner, and snacks. Aim for eggs, milk, yogurt, chicken, fish, dhal, or soy foods.',
  },
  {
    question: 'What foods give energy?',
    answer: 'Carbs are the main fuel for training. Use rice, roti, bread, oats, bananas, potatoes, and fruits before and after exercise.',
  },
  {
    question: 'How can I lose weight and still play sports?',
    answer: 'For fat loss, use a small calorie deficit, keep protein high, and still eat carbs around training so performance stays strong.',
  },
  {
    question: 'How can I gain muscle?',
    answer: 'For muscle gain, eat a small calorie surplus, train hard, and include protein at every main meal with carbs around workouts.',
  },
  {
    question: 'What should I eat on match day?',
    answer: 'On match day, eat a main meal 2–3 hours before, take a light snack before the game, sip water often, and recover right after the match.',
  },
  {
    question: 'What should I eat for breakfast as an athlete?',
    answer: 'A strong athlete breakfast can be oats, eggs, toast, fruit, or rice-based dishes. Breakfast should give energy, not make you feel heavy.',
  },
  {
    question: 'What should I eat for lunch?',
    answer: 'Lunch should be balanced: rice or roti, a protein source, vegetables, and fruit. This helps maintain energy for afternoon training.',
  },
  {
    question: 'What should I eat for dinner?',
    answer: 'Dinner should help recovery: rice or roti with fish, chicken, dhal, vegetables, and yogurt or curd if available.',
  },
  {
    question: 'What are good sports snacks?',
    answer: 'Good sports snacks include banana, yogurt, nuts, boiled eggs, peanut butter toast, dates, and fruit smoothies.',
  },
  {
    question: 'Are supplements necessary?',
    answer: 'Supplements are optional. Food first is best. Creatine and whey can help, but they should be used carefully and with guidance from a coach or professional.',
  },
  {
    question: 'Can vegetarian athletes perform well?',
    answer: 'Vegetarian athletes can still perform well with dhal, chickpeas, soy, milk, yogurt, eggs, peanuts, beans, rice, and vegetables.',
  },
  {
    question: 'What is a full day meal plan?',
    answer: 'A full athlete day should include breakfast, lunch, dinner, 2–3 snacks, pre-workout fuel, post-workout recovery, and steady hydration.',
  },
  {
    question: 'Give me nutrition tips for sports.',
    answer: 'My top advice: eat enough, time meals around training, drink water regularly, and choose simple campus-friendly foods you can repeat daily.',
  },
  {
    question: 'What should I do before a workout?',
    answer: 'Before workouts, choose easy carbs like banana, toast, oats, or rice and avoid heavy oily meals right before exercise.',
  },
];

const findSportFromMessage = (message) => {
  const lower = message.toLowerCase();
  for (const [sportKey, keywords] of Object.entries(sportKeywords)) {
    if (keywords.some((word) => lower.includes(word))) {
      return sportKey;
    }
  }
  return null;
};

const matchAnswerBank = (message) => {
  const lower = normalizeText(message);

  const exactMatch = exactQuestionBank.find(({ question }) => normalizeText(question) === lower);
  if (exactMatch) return exactMatch.answer;

  const matched = answerBank.find((entry) => entry.patterns.some((pattern) => lower.includes(normalizeText(pattern))));
  return matched?.answer || null;
};

const answerFromKeywords = (message, sport, ageGroup) => {
  const lower = normalizeText(message);
  const detectedSport = findSportFromMessage(lower);
  const activeSport = detectedSport || sport;
  const sportTips = sportSpecificTips[activeSport] || sportSpecificTips.football;
  const mealExample = mealExamples[activeSport] || mealExamples.default;
  const hydrationTarget = hydrationTargets[activeSport] || hydrationTargets.default;

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return 'Hi! Ask me about meal plans, pre-workout, post-workout, hydration, match-day nutrition, macros, and recovery tips.';
  }

  if (lower.includes('meal plan') || lower.includes('diet') || lower.includes('what should i eat') || lower.includes('meal')) {
    return `For ${activeSport || 'student athletes'}, start with this ${mealExample}. Daily focus: ${sportTips[0]} ${sportTips[1]}`;
  }

  if (lower.includes('pre workout') || lower.includes('before training') || lower.includes('before match') || lower.includes('before workout')) {
    return `Pre-workout for ${activeSport || 'sports training'}: easy carbs + light protein (banana, toast, oats, yogurt). Avoid oily foods close to training.`;
  }

  if (lower.includes('post workout') || lower.includes('after training') || lower.includes('recovery')) {
    return 'Post-workout: take carbs + protein within 20–30 min (milk/protein shake + banana, eggs + bread, or rice + lean protein).';
  }

  if (lower.includes('hydration') || lower.includes('water') || lower.includes('drink')) {
    return `Hydration target for ${activeSport || 'your profile'} is around ${hydrationTarget} per day. Add about 500ml per training hour, and include electrolytes for intense sessions.`;
  }

  if (lower.includes('calorie') || lower.includes('kcal') || lower.includes('energy')) {
    if (!activeSport) {
      return 'Share your sport and age group, and I can estimate daily calories more accurately.';
    }
    return `For ${activeSport}, energy needs are usually high on training days. Keep carbs as your main fuel and adjust total calories by training intensity${ageGroup ? ` for age group ${ageGroup}` : ''}.`;
  }

  if (lower.includes('match day') || lower.includes('game day')) {
    return `Match-day nutrition for ${activeSport || 'athletes'}: carbs 2-3 hours before, light snack 30-60 min before, steady hydration, and recovery meal after the match.`;
  }

  if (lower.includes('protein')) {
    return 'For athletes, keep protein spread across the day (breakfast, lunch, dinner, plus snacks). A practical target is around 20–40g per main meal depending on body size and training load.';
  }

  if (lower.includes('carb') || lower.includes('macros') || lower.includes('fat')) {
    return 'Use easy-to-digest carbs before sessions (banana, toast, rice cakes), then recover with carbs + protein within 30 minutes after training.';
  }

  if (lower.includes('weight') || lower.includes('fat loss') || lower.includes('cut')) {
    return 'For healthy fat loss, reduce calories slightly (not aggressively), keep protein high, and maintain carbs around training times so performance stays strong.';
  }

  if (lower.includes('muscle') || lower.includes('bulk') || lower.includes('gain')) {
    return 'For muscle gain, use a small calorie surplus, prioritize protein at every meal, and include carb-rich meals around workouts for better training quality.';
  }

  if (lower.includes('supplement') || lower.includes('creatine')) {
    return 'Supplements can help, but food-first is best. Creatine monohydrate (5g/day) and whey are common options; always confirm with your coach or nutrition professional.';
  }

  return null;
};

export const getSportsChatbotReply = ({ message, sport, ageGroup }) => {
  const trimmed = (message || '').trim();
  if (!trimmed) {
    return 'Please type a question and I will help with your sports meal and hydration plan.';
  }

  const bankReply = matchAnswerBank(trimmed);
  if (bankReply) return bankReply;

  const keywordReply = answerFromKeywords(trimmed, sport, ageGroup);
  if (keywordReply) return keywordReply;

  const detectedSport = findSportFromMessage(trimmed);
  const activeSport = detectedSport || sport;

  const tips = sportSpecificTips[activeSport] || [
    'Balance your plate: carbs for energy, protein for repair, fats for hormones and satiety.',
    'Stay consistent with meal timing around workouts for better performance and recovery.',
  ];

  return `For your training, focus on this: ${tips[0]} Also, ${tips[1]} Ask me a specific question on pre-workout, post-workout, hydration, calories, meal plan, or match-day.`;
};
