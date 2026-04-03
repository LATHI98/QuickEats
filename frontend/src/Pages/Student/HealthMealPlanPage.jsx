import React, { useState } from 'react';
import {
  Salad, ChevronDown, Flame, Beef, Wheat, Droplets,
  Clock, Zap, Trophy, Target, Sun, Sunrise, Moon, Coffee, Apple
} from 'lucide-react';

// ── Sport Definitions ────────────────────────────────────────────────────────
const SPORTS = {
  football:    { label: 'Football',         emoji: '⚽', color: 'text-green-600',   bg: 'bg-green-50',   border: 'border-green-200',  tag: 'bg-green-600',  desc: 'High-intensity intermittent sport requiring speed, power and 90-min endurance.',    macros: { protein: 25, carbs: 55, fat: 20 } },
  basketball:  { label: 'Basketball',       emoji: '🏀', color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200', tag: 'bg-orange-600', desc: 'Explosive sport combining sprints, jumps and full-court lateral movement.',         macros: { protein: 25, carbs: 55, fat: 20 } },
  swimming:    { label: 'Swimming',         emoji: '🏊', color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',   tag: 'bg-blue-600',   desc: 'Full-body low-impact sport with very high energy and hydration demands.',           macros: { protein: 22, carbs: 58, fat: 20 } },
  athletics:   { label: 'Athletics / Running', emoji: '🏃', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', tag: 'bg-yellow-600', desc: 'Endurance-focused sport requiring glycogen loading and fast recovery.',            macros: { protein: 20, carbs: 60, fat: 20 } },
  cricket:     { label: 'Cricket',          emoji: '🏏', color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',    tag: 'bg-red-600',    desc: 'Long-duration sport needing sustained energy, focus and hand-eye coordination.',  macros: { protein: 22, carbs: 55, fat: 23 } },
  badminton:   { label: 'Badminton',        emoji: '🏸', color: 'text-purple-600',  bg: 'bg-purple-50',  border: 'border-purple-200', tag: 'bg-purple-600', desc: 'Fast-paced agility sport with quick-burst energy and reaction demands.',           macros: { protein: 23, carbs: 54, fat: 23 } },
  volleyball:  { label: 'Volleyball',       emoji: '🏐', color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200', tag: 'bg-indigo-600', desc: 'Team sport requiring jump power, shoulder strength and sustained lateral speed.',  macros: { protein: 24, carbs: 54, fat: 22 } },
  rugby:       { label: 'Rugby',            emoji: '🏉', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200',tag: 'bg-emerald-600',desc: 'High-contact sport demanding maximum strength, power and collision recovery.',      macros: { protein: 30, carbs: 48, fat: 22 } },
  tennis:      { label: 'Tennis',           emoji: '🎾', color: 'text-lime-600',    bg: 'bg-lime-50',    border: 'border-lime-200',   tag: 'bg-lime-600',   desc: 'Skill-based sport with short explosive rallies over extended match durations.',    macros: { protein: 22, carbs: 55, fat: 23 } },
  gym:         { label: 'Gym / Bodybuilding',emoji: '🏋️', color: 'text-slate-600',  bg: 'bg-slate-50',   border: 'border-slate-200',  tag: 'bg-slate-600',  desc: 'Resistance training focused on hypertrophy, strength and sculpting.',             macros: { protein: 32, carbs: 45, fat: 23 } },
  cycling:     { label: 'Cycling',          emoji: '🚴', color: 'text-teal-600',    bg: 'bg-teal-50',    border: 'border-teal-200',   tag: 'bg-teal-600',   desc: 'Long-distance endurance sport with very high carbohydrate and fluid needs.',      macros: { protein: 18, carbs: 62, fat: 20 } },
  martial_arts:{ label: 'Martial Arts',     emoji: '🥋', color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200',   tag: 'bg-rose-600',   desc: 'Discipline requiring explosive power, flexibility and lean mass maintenance.',    macros: { protein: 28, carbs: 50, fat: 22 } },
};

// ── Age Groups ────────────────────────────────────────────────────────────────
const AGE_GROUPS = {
  '17-19': { label: '17 – 19 yrs', tag: 'Junior',      multiplier: 0.95 },
  '20-22': { label: '20 – 22 yrs', tag: 'Undergraduate', multiplier: 1.00 },
  '23-25': { label: '23 – 25 yrs', tag: 'Advanced',    multiplier: 1.05 },
  '26+':   { label: '26 + yrs',    tag: 'Senior',       multiplier: 0.98 },
};

// ── Base Calories per Sport ────────────────────────────────────────────────────
const BASE_CALORIES = {
  football: 3000, basketball: 2900, swimming: 3200, athletics: 2800,
  cricket: 2600, badminton: 2500, volleyball: 2700, rugby: 3400,
  tennis: 2600, gym: 3100, cycling: 3300, martial_arts: 2850,
};

// ── Meal Plans per Sport ──────────────────────────────────────────────────────
const MEAL_PLANS = {
  football: {
    preWorkout: { time: '1.5 hrs before', items: ['2 slices brown bread with peanut butter', 'Banana', '300ml water'] },
    postWorkout: { time: '30 min after',  items: ['Chocolate milk 250ml', 'Hard-boiled eggs x2', 'Dates x3'] },
    meals: [
      { label: 'Breakfast',        time: '7:00 AM',  icon: Sunrise, color: 'text-yellow-500', items: ['Oats porridge with honey and banana', 'Scrambled eggs x3', 'Whole wheat toast x2', 'Orange juice 250ml']  },
      { label: 'Mid-Morning Snack',time: '10:00 AM', icon: Apple,   color: 'text-green-500',  items: ['Mixed fruit bowl (papaya, apple, guava)', 'Yogurt 150g', 'Almonds 20g'] },
      { label: 'Lunch',            time: '1:00 PM',  icon: Sun,     color: 'text-orange-500', items: ['White rice 2 cups', 'Grilled chicken 150g', 'Dhal curry', 'Cabbage stir-fry', 'Fresh salad with lime'] },
      { label: 'Afternoon Snack',  time: '4:00 PM',  icon: Coffee,  color: 'text-amber-500',  items: ['Bread with egg curry', 'Milo 300ml', 'Banana x1'] },
      { label: 'Dinner',           time: '7:30 PM',  icon: Moon,    color: 'text-indigo-500', items: ['Rice or roti x2', 'Fish curry (tuna/mackerel)', 'Lentil soup', 'Steamed vegetables', 'Coconut sambol'] },
    ],
    tips: ['Hydrate with 500ml water 2 hrs before match', 'Avoid heavy fried foods on training days', 'Eat within 30 min after training for best recovery', 'Include iron-rich foods (green leaves, dhal) weekly'],
  },
  basketball: {
    preWorkout: { time: '1.5 hrs before', items: ['Rice with small chicken portion', '200ml sports drink', 'Banana'] },
    postWorkout: { time: '30 min after',  items: ['Protein shake or milk 300ml', 'Boiled egg x2', 'Apple'] },
    meals: [
      { label: 'Breakfast',        time: '7:00 AM',  icon: Sunrise, color: 'text-yellow-500', items: ['String hoppers x6 with coconut milk', 'Boiled eggs x2', 'Pol sambol', 'Milo 300ml'] },
      { label: 'Mid-Morning Snack',time: '10:00 AM', icon: Apple,   color: 'text-green-500',  items: ['Granola bar', 'Peanut butter sandwich', 'Watermelon slice'] },
      { label: 'Lunch',            time: '1:00 PM',  icon: Sun,     color: 'text-orange-500', items: ['Fried rice with egg and vegetables', 'Chicken curry 150g', 'Papadum x2', 'Lime juice'] },
      { label: 'Afternoon Snack',  time: '4:30 PM',  icon: Coffee,  color: 'text-amber-500',  items: ['Kottu roti (small)', 'Chocolate milk 250ml'] },
      { label: 'Dinner',           time: '7:30 PM',  icon: Moon,    color: 'text-indigo-500', items: ['Brown rice 1.5 cups', 'Beef or chicken stir-fry', 'Mixed vegetables', 'Dhal', 'Plain yogurt'] },
    ],
    tips: ['Jump explosively — load carbs the day before games', 'Drink 250ml water every 20 min during play', 'Include zinc-rich foods (pumpkin seeds, chickpeas)', 'Sleep 8 hrs minimum for muscle repair'],
  },
  swimming: {
    preWorkout: { time: '2 hrs before',  items: ['Carb-heavy meal: rice + mild curry', 'Banana x2', '400ml water'] },
    postWorkout: { time: '20 min after', items: ['Milk 300ml', 'Mixed nuts 30g', 'Dates x4', 'Electrolyte drink'] },
    meals: [
      { label: 'Breakfast',        time: '6:30 AM',  icon: Sunrise, color: 'text-yellow-500', items: ['Oats with warm milk, honey & raisins', 'Boiled eggs x3', 'Whole grain bread x2', 'Fresh orange juice'] },
      { label: 'Mid-Morning Snack',time: '9:30 AM',  icon: Apple,   color: 'text-green-500',  items: ['Banana bread slice x2', 'Greek yogurt 150g', 'Kiwi x1'] },
      { label: 'Lunch',            time: '12:30 PM', icon: Sun,     color: 'text-orange-500', items: ['Rice 2.5 cups', 'Tuna curry (high omega-3)', 'Potato curry', 'Spinach stir-fry', 'Salad with sesame'] },
      { label: 'Afternoon Snack',  time: '4:00 PM',  icon: Coffee,  color: 'text-amber-500',  items: ['Peanut butter toast x2', 'Chocolate Milo 300ml', 'Apple x1'] },
      { label: 'Dinner',           time: '7:00 PM',  icon: Moon,    color: 'text-indigo-500', items: ['Pasta or noodles with egg', 'Grilled fish 150g', 'Steamed broccoli and carrots', 'Lentil soup', 'Curd'] },
    ],
    tips: ['Swimmers lose electrolytes even without feeling sweaty — drink often', 'High omega-3 intake (tuna, sardines) reduces joint inflammation', 'Eat calorie-dense snacks due to high water energy burn', 'Avoid carbonated drinks — causes drag from gas'],
  },
  athletics: {
    preWorkout: { time: '1 hr before',   items: ['Energy bar or banana x2', '300ml water or sports drink'] },
    postWorkout: { time: '30 min after', items: ['Chocolate milk 300ml', 'Bread with peanut butter', 'Banana'] },
    meals: [
      { label: 'Breakfast',        time: '6:45 AM',  icon: Sunrise, color: 'text-yellow-500', items: ['Hoppers x3 with egg', 'Banana x2', 'Milo 300ml', 'Mixed fruit'] },
      { label: 'Mid-Morning Snack',time: '10:00 AM', icon: Apple,   color: 'text-green-500',  items: ['Dates x5', 'Almonds 25g', 'Coconut water 300ml'] },
      { label: 'Lunch',            time: '1:00 PM',  icon: Sun,     color: 'text-orange-500', items: ['White rice 2 cups + extra', 'Chicken or fish curry', 'Carrot & bean stir-fry', 'Papadum', 'Lime'] },
      { label: 'Afternoon Snack',  time: '5:00 PM',  icon: Coffee,  color: 'text-amber-500',  items: ['Energy bars x2', 'Sports drink 400ml', 'Banana x1'] },
      { label: 'Dinner',           time: '7:30 PM',  icon: Moon,    color: 'text-indigo-500', items: ['Roti x3 with dhal', 'Beef or chicken curry', 'Mixed greens salad', 'Curd 100g'] },
    ],
    tips: ['Carb-load 2 days before competition with rice and pasta', 'Run on empty only for easy recovery jogs — never hard sessions', 'Replenish sodium with a pinch of salt in water after long runs', 'A banana 30 min before training is your best friend'],
  },
  cricket: {
    preWorkout: { time: '2 hrs before',  items: ['Rice with dal and vegetables', 'Banana x1', '400ml water'] },
    postWorkout: { time: '45 min after', items: ['Egg sandwich x2', 'Milk or lassi 300ml', 'Mixed fruit'] },
    meals: [
      { label: 'Breakfast',        time: '7:00 AM',  icon: Sunrise, color: 'text-yellow-500', items: ['Bread toast x3 with egg and cheese', 'Banana x2', 'Orange juice 250ml', 'Yogurt 100g'] },
      { label: 'Mid-Morning Snack',time: '10:30 AM', icon: Apple,   color: 'text-green-500',  items: ['Mixed nuts and dried fruits 40g', 'Apple x1', 'Coconut water'] },
      { label: 'Lunch (Match Day)',  time: '12:30 PM', icon: Sun,     color: 'text-orange-500', items: ['Biryani rice (moderate)', 'Grilled fish or chicken 150g', 'Salad', 'Fruit juice'] },
      { label: 'Tea Break',        time: '3:30 PM',  icon: Coffee,  color: 'text-amber-500',  items: ['Cream crackers with cheese', 'Milo 300ml', 'Banana x1', 'Watermelon'] },
      { label: 'Dinner',           time: '7:30 PM',  icon: Moon,    color: 'text-indigo-500', items: ['Rice 2 cups', 'Fish or prawn curry', 'Green salad', 'Papadum', 'Curd'] },
    ],
    tips: ['Stay hydrated during long innings — keep water nearby', 'Avoid heavy meals before batting/fielding sets', 'Eat consistent small meals to maintain concentration', 'Include magnesium foods (banana, nuts) to prevent cramps'],
  },
  badminton: {
    preWorkout: { time: '1 hr before',   items: ['Light carbs: rice cakes or bread', 'Banana x1', '300ml water'] },
    postWorkout: { time: '20 min after', items: ['Protein milk or yogurt', 'Energy bar', 'Coconut water'] },
    meals: [
      { label: 'Breakfast',        time: '7:00 AM',  icon: Sunrise, color: 'text-yellow-500', items: ['Idli x4 with sambar', 'Boiled eggs x2', 'Fresh juice 200ml'] },
      { label: 'Mid-Morning Snack',time: '10:00 AM', icon: Apple,   color: 'text-green-500',  items: ['Fruit smoothie (banana + milk)', 'Whole wheat crackers 6 pcs'] },
      { label: 'Lunch',            time: '1:00 PM',  icon: Sun,     color: 'text-orange-500', items: ['Rice 1.5 cups', 'Lentil curry', 'Tempered greens', 'Fish fry 100g', 'Salad'] },
      { label: 'Afternoon Snack',  time: '4:30 PM',  icon: Coffee,  color: 'text-amber-500',  items: ['Roti x1 with coconut', 'Milo 250ml', 'Orange x1'] },
      { label: 'Dinner',           time: '7:30 PM',  icon: Moon,    color: 'text-indigo-500', items: ['Rice 1.5 cups or noodles', 'Chicken stir-fry 120g', 'Vegetable curry', 'Plain yogurt'] },
    ],
    tips: ['Quick reaction sports need fast carbs: banana or raisins before warm-up', 'Strengthen wrists and ankles — eat calcium-rich foods (dairy, gotukola)', 'Replace lost fluids quickly between games', 'Light stretching meals: avoid spicy food before play'],
  },
  volleyball: {
    preWorkout: { time: '1.5 hrs before', items: ['Bread with peanut butter and honey', 'Banana x1', '300ml water'] },
    postWorkout: { time: '30 min after',  items: ['Milk 300ml', 'Boiled eggs x2', 'Dates x4'] },
    meals: [
      { label: 'Breakfast',        time: '7:00 AM',  icon: Sunrise, color: 'text-yellow-500', items: ['Roti x2 with egg and dhal', 'Milo 300ml', 'Papaya slice'] },
      { label: 'Mid-Morning Snack',time: '10:30 AM', icon: Apple,   color: 'text-green-500',  items: ['Banana x2', 'Peanuts 30g', 'Coconut water 300ml'] },
      { label: 'Lunch',            time: '1:00 PM',  icon: Sun,     color: 'text-orange-500', items: ['Rice 2 cups', 'Tuna curry', 'Pumpkin curry', 'Salad', 'Lime juice'] },
      { label: 'Afternoon Snack',  time: '4:30 PM',  icon: Coffee,  color: 'text-amber-500',  items: ['Sandwich with chicken', 'Fruit juice 250ml'] },
      { label: 'Dinner',           time: '8:00 PM',  icon: Moon,    color: 'text-indigo-500', items: ['Brown rice 1.5 cups', 'Prawn or fish curry', 'Dhal', 'Stir-fried cabbage', 'Curd'] },
    ],
    tips: ['Jump higher with calcium and Vitamin D — eat dairy and get sunlight', 'Shoulder endurance: include fish and nuts for joint health', 'Hydrate between every set during matches', 'Avoid skipping breakfast on game days'],
  },
  rugby: {
    preWorkout: { time: '2 hrs before',  items: ['Full rice meal with chicken', 'Banana x2', '500ml water'] },
    postWorkout: { time: '20 min after', items: ['Protein shake 40g', 'Rice or bread with meat', 'Milk 300ml'] },
    meals: [
      { label: 'Breakfast',        time: '6:30 AM',  icon: Sunrise, color: 'text-yellow-500', items: ['Oats with whole milk and protein powder', 'Eggs x4 (scrambled)', 'Whole grain bread x3', 'Banana x2', 'Milo 400ml'] },
      { label: 'Mid-Morning Snack',time: '10:00 AM', icon: Apple,   color: 'text-green-500',  items: ['Peanut butter sandwich x2', 'Mixed nuts 40g', 'Apple x1'] },
      { label: 'Lunch',            time: '1:00 PM',  icon: Sun,     color: 'text-orange-500', items: ['Rice 2.5–3 cups', 'Beef curry 200g', 'Dhal', 'Tempered vegetables', 'Salad + lime'] },
      { label: 'Afternoon Snack',  time: '4:30 PM',  icon: Coffee,  color: 'text-amber-500',  items: ['Egg kottu or bread with egg', 'Chocolate milk 300ml', 'Banana x1'] },
      { label: 'Dinner',           time: '7:30 PM',  icon: Moon,    color: 'text-indigo-500', items: ['Rice 2 cups', 'Chicken or mutton curry 200g', 'Green jackfruit or potato', 'Lentil soup', 'Curd 150g'] },
    ],
    tips: ['Highest calorie sport — never under-eat or you will lose muscle mass', 'Load protein within 20 min post-collision to repair micro-tears', 'Iron is critical: eat red meat 2–3x/week with Vitamin C for absorption', 'Sleep 9 hrs on contact training days for full CNS recovery'],
  },
  tennis: {
    preWorkout: { time: '1.5 hrs before', items: ['Pasta or rice with light sauce', 'Banana x1', '300ml water'] },
    postWorkout: { time: '30 min after',  items: ['Chocolate milk 300ml', 'Whole grain crackers', 'Ham/tuna sandwich'] },
    meals: [
      { label: 'Breakfast',        time: '7:30 AM',  icon: Sunrise, color: 'text-yellow-500', items: ['Avocado toast x2', 'Boiled eggs x2', 'Orange juice 250ml', 'Mixed berries or papaya'] },
      { label: 'Mid-Morning Snack',time: '10:30 AM', icon: Apple,   color: 'text-green-500',  items: ['Energy bar', 'Banana x1', 'Coconut water 300ml'] },
      { label: 'Lunch',            time: '1:00 PM',  icon: Sun,     color: 'text-orange-500', items: ['Rice 1.5 cups', 'Grilled chicken 130g', 'Salad with olive oil', 'Vegetable soup', 'Papadum'] },
      { label: 'Afternoon Snack',  time: '4:30 PM',  icon: Coffee,  color: 'text-amber-500',  items: ['Roti x1 with nuts and honey', 'Milo 250ml'] },
      { label: 'Dinner',           time: '7:30 PM',  icon: Moon,    color: 'text-indigo-500', items: ['Brown rice 1 cup', 'Fish or chicken curry', 'Spinach dhal', 'Cucumber salad', 'Yogurt'] },
    ],
    tips: ['Match play can last 2–3 hrs — carry banana and water courtside', 'Grip endurance: eat potassium-rich foods to prevent wrist cramps', 'Anti-inflammatory diet (turmeric, ginger, fish) helps shoulder recovery', 'Light, digestible meals on match mornings'],
  },
  gym: {
    preWorkout: { time: '45 min before', items: ['Black coffee (optional)', 'Banana x1 or rice cakes', 'Protein shake or boiled eggs x2'] },
    postWorkout: { time: '30 min after', items: ['Whey protein 30–40g in milk', 'Banana x1', 'Handful of nuts'] },
    meals: [
      { label: 'Breakfast',        time: '7:00 AM',  icon: Sunrise, color: 'text-yellow-500', items: ['Eggs x4 (whole + whites scrambled)', 'Oats 80g with milk and banana', 'Whole grain bread x2', 'Orange juice 200ml'] },
      { label: 'Mid-Morning Snack',time: '10:00 AM', icon: Apple,   color: 'text-green-500',  items: ['Greek yogurt 200g with honey', 'Mixed nuts 30g', 'Apple x1'] },
      { label: 'Lunch',            time: '1:00 PM',  icon: Sun,     color: 'text-orange-500', items: ['Brown rice 1.5 cups', 'Chicken breast 180g (grilled)', 'Lentil curry', 'Broccoli & carrot stir-fry', 'Salad'] },
      { label: 'Afternoon Snack',  time: '4:00 PM',  icon: Coffee,  color: 'text-amber-500',  items: ['Protein bar or bread with peanut butter', 'Banana x1', 'Milk or Milo 300ml'] },
      { label: 'Dinner',           time: '7:30 PM',  icon: Moon,    color: 'text-indigo-500', items: ['Sweet potato or rice 1 cup', 'Beef or tuna 150g', 'Egg omelet x2', 'Spinach salad', 'Curd 150g'] },
    ],
    tips: ['Track protein: target 2g per kg of body weight daily', 'Sleep is when muscles grow — 8 hrs minimum', 'Progressive overload requires progressive eating: add 100 cal on heavy lift days', 'Creatine monohydrate 5g/day improves strength (consult your coach)'],
  },
  cycling: {
    preWorkout: { time: '2 hrs before',  items: ['Large rice meal with banana', 'Energy gel or bar', '500ml water'] },
    postWorkout: { time: '20 min after', items: ['Chocolate milk 400ml', 'Bread x2 with jam/peanut butter', 'Banana x2'] },
    meals: [
      { label: 'Breakfast',        time: '6:30 AM',  icon: Sunrise, color: 'text-yellow-500', items: ['Large bowl oats with banana and honey', 'Eggs x3', 'Toast x2', 'Sports drink 300ml'] },
      { label: 'Mid-Morning Snack',time: '9:30 AM',  icon: Apple,   color: 'text-green-500',  items: ['Energy bar x2', 'Dates x6', 'Coconut water 300ml'] },
      { label: 'Lunch',            time: '12:30 PM', icon: Sun,     color: 'text-orange-500', items: ['Rice 3 cups', 'Chicken or fish curry', 'Dhal', 'Pumpkin stir-fry', 'Lime juice'] },
      { label: 'Afternoon Snack',  time: '4:30 PM',  icon: Coffee,  color: 'text-amber-500',  items: ['Rice cakes with peanut butter', 'Banana x2', 'Electrolyte drink 400ml'] },
      { label: 'Dinner',           time: '7:30 PM',  icon: Moon,    color: 'text-indigo-500', items: ['Pasta 200g with tomato/egg sauce', 'Tuna fill 100g', 'Mixed green salad', 'Curd'] },
    ],
    tips: ['Cycling burns 600–900 cal/hr — never skip meals on ride days', 'Carry dates or gels for climbs longer than 45 min', 'Salt tablets or electrolyte drinks prevent bonking on long rides', 'Carb load the night before any ride over 2 hours'],
  },
  martial_arts: {
    preWorkout: { time: '1.5 hrs before', items: ['Rice with lean protein', 'Banana x1', '300ml water'] },
    postWorkout: { time: '30 min after',  items: ['Protein shake or boiled eggs x3', 'Banana x1', 'Coconut water'] },
    meals: [
      { label: 'Breakfast',        time: '7:00 AM',  icon: Sunrise, color: 'text-yellow-500', items: ['Hoppers x3 with egg', 'Banana x2', 'Milo 300ml', 'Papaya'] },
      { label: 'Mid-Morning Snack',time: '10:30 AM', icon: Apple,   color: 'text-green-500',  items: ['Nuts and dried fruit mix 35g', 'Yogurt 150g', 'Apple x1'] },
      { label: 'Lunch',            time: '1:00 PM',  icon: Sun,     color: 'text-orange-500', items: ['Rice 1.5 cups', 'Chicken curry 140g', 'Bean curry', 'Mixed salad', 'Lime juice'] },
      { label: 'Afternoon Snack',  time: '4:30 PM',  icon: Coffee,  color: 'text-amber-500',  items: ['Bread with peanut butter x2', 'Chocolate milk 250ml'] },
      { label: 'Dinner',           time: '7:30 PM',  icon: Moon,    color: 'text-indigo-500', items: ['Brown rice 1 cup', 'Fish curry 120g', 'Tempered spinach', 'Dhal', 'Curd'] },
    ],
    tips: ['Maintain lean body mass — high protein protects muscle during cuts', 'Flexibility requires good hydration and anti-inflammatory foods', 'Avoid training on a full stomach — it impairs movement speed', 'Vitamin C and zinc boost recovery from bruising and impact'],
  },
};

// ── Dropdown ──────────────────────────────────────────────────────────────────
const Dropdown = ({ label, value, onChange, options, placeholder }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-white border-2 border-gray-100 focus:border-orange-500 rounded-2xl px-5 py-4 pr-12 outline-none font-bold text-gray-800 text-sm transition-all cursor-pointer shadow-sm">
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

// ── Macro Bar ─────────────────────────────────────────────────────────────────
const MacroBar = ({ label, pct, grams, color, bg }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-xs font-bold text-gray-500">{label}</span>
      <span className={`text-xs font-extrabold ${color}`}>{pct}% · {grams}g</span>
    </div>
    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${bg} transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  </div>
);

// ── Meal Card ─────────────────────────────────────────────────────────────────
const MealCard = ({ meal }) => {
  const Icon = meal.icon;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
          <Icon size={18} className={meal.color} />
        </div>
        <div>
          <p className="font-bold text-gray-800 text-sm">{meal.label}</p>
          <p className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
            <Clock size={10} /> {meal.time}
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {meal.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs font-medium text-gray-600">
            <span className="mt-1.5 w-1.5 h-1.5 bg-orange-400 rounded-full shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const HealthMealPlanPage = () => {
  const [sport, setSport] = useState('');
  const [ageGroup, setAgeGroup] = useState('');

  const sportMeta  = sport    ? SPORTS[sport]     : null;
  const ageMeta    = ageGroup ? AGE_GROUPS[ageGroup] : null;
  const plan       = sport    ? MEAL_PLANS[sport] : null;

  const calories = sport && ageGroup
    ? Math.round(BASE_CALORIES[sport] * AGE_GROUPS[ageGroup].multiplier)
    : null;

  const macros = sportMeta && calories ? {
    protein: { pct: sportMeta.macros.protein, grams: Math.round(calories * sportMeta.macros.protein / 100 / 4) },
    carbs:   { pct: sportMeta.macros.carbs,   grams: Math.round(calories * sportMeta.macros.carbs   / 100 / 4) },
    fat:     { pct: sportMeta.macros.fat,     grams: Math.round(calories * sportMeta.macros.fat     / 100 / 9) },
  } : null;

  const sportOptions = Object.entries(SPORTS).map(([v, s]) => ({ value: v, label: `${s.emoji}  ${s.label}` }));
  const ageOptions   = Object.entries(AGE_GROUPS).map(([v, a]) => ({ value: v, label: `${a.label}  (${a.tag})` }));

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Sports Meal Planner</h1>
          <p className="text-gray-400 font-medium mt-1">
            SLIIT athlete nutrition guide — select your sport and age to get your personalised daily meal plan.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-2xl border border-orange-100">
          <Trophy size={16} />
          <span className="text-xs font-bold">SLIIT Sport Programme</span>
        </div>
      </div>

      {/* ── Dropdowns ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
        <p className="text-sm font-bold text-gray-700 mb-5 flex items-center gap-2">
          <Target size={16} className="text-orange-500" /> Choose your sport and age group
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Dropdown
            label="Sport / Activity"
            value={sport}
            onChange={setSport}
            options={sportOptions}
            placeholder="— Select your sport —"
          />
          <Dropdown
            label="Age Category"
            value={ageGroup}
            onChange={setAgeGroup}
            options={ageOptions}
            placeholder="— Select age group —"
          />
        </div>

        {/* Sport badge + description */}
        {sportMeta && (
          <div className={`mt-5 flex items-start gap-3 p-4 rounded-2xl border ${sportMeta.border} ${sportMeta.bg}`}>
            <span className="text-3xl leading-none">{sportMeta.emoji}</span>
            <div>
              <p className={`font-bold text-sm ${sportMeta.color}`}>{sportMeta.label}</p>
              <p className="text-xs font-medium text-gray-500 mt-0.5">{sportMeta.desc}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {calories && macros && plan && sportMeta && ageMeta ? (
        <>
          {/* ── Stats Bar ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Daily Calories',  value: `${calories.toLocaleString()} kcal`, icon: Flame,    bg: 'bg-orange-50',  color: 'text-orange-600'  },
              { label: 'Protein Target',  value: `${macros.protein.grams}g / day`,    icon: Beef,     bg: 'bg-red-50',     color: 'text-red-500'     },
              { label: 'Carbohydrates',   value: `${macros.carbs.grams}g / day`,      icon: Wheat,    bg: 'bg-yellow-50',  color: 'text-yellow-600'  },
              { label: 'Healthy Fats',    value: `${macros.fat.grams}g / day`,        icon: Droplets, bg: 'bg-blue-50',    color: 'text-blue-500'    },
            ].map(s => {
              const SIcon = s.icon;
              return (
                <div key={s.label} className={`${s.bg} rounded-2xl p-5 border border-gray-100`}>
                  <div className="flex items-center gap-2 mb-2">
                    <SIcon size={15} className={s.color} />
                    <p className="text-xs font-bold text-gray-400">{s.label}</p>
                  </div>
                  <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                </div>
              );
            })}
          </div>

          {/* ── Macro Breakdown ── */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
            <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
              <Zap size={16} className="text-orange-500" /> Macro Breakdown
              <span className="ml-auto text-xs font-medium text-gray-400">
                {ageMeta.tag} · {ageMeta.label}
              </span>
            </h2>
            <div className="space-y-4">
              <MacroBar label="Protein"      pct={macros.protein.pct} grams={macros.protein.grams} color="text-red-500"    bg="bg-red-400"    />
              <MacroBar label="Carbohydrates"pct={macros.carbs.pct}   grams={macros.carbs.grams}   color="text-yellow-600" bg="bg-yellow-400" />
              <MacroBar label="Fats"         pct={macros.fat.pct}     grams={macros.fat.grams}     color="text-blue-500"   bg="bg-blue-400"   />
            </div>
          </div>

          {/* ── Pre / Post Workout ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { label: '⚡ Pre-Workout', sub: plan.preWorkout.time,  items: plan.preWorkout.items,  bg: 'bg-yellow-50', border: 'border-yellow-200', color: 'text-yellow-700' },
              { label: '💪 Post-Workout', sub: plan.postWorkout.time, items: plan.postWorkout.items, bg: 'bg-green-50',  border: 'border-green-200',  color: 'text-green-700' },
            ].map(w => (
              <div key={w.label} className={`${w.bg} rounded-2xl border ${w.border} p-6`}>
                <p className={`font-bold text-sm ${w.color} mb-1`}>{w.label}</p>
                <p className="text-[11px] text-gray-400 font-medium mb-4 flex items-center gap-1"><Clock size={10}/> {w.sub}</p>
                <ul className="space-y-2">
                  {w.items.map((it, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-medium text-gray-600">
                      <span className="mt-1.5 w-1.5 h-1.5 bg-orange-400 rounded-full shrink-0" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* ── Daily Meal Schedule ── */}
          <div>
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Sun size={16} className="text-orange-500" /> Daily Meal Schedule
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {plan.meals.map((meal, i) => <MealCard key={i} meal={meal} />)}
            </div>
          </div>

          {/* ── Hydration ── */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Droplets size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="font-bold text-blue-700 text-sm">Daily Hydration Target</p>
              <p className="text-2xl font-extrabold text-blue-600 mt-1">
                {sport === 'swimming' || sport === 'cycling' ? '3.5 – 4.5 L' : sport === 'rugby' || sport === 'football' ? '3.0 – 4.0 L' : '2.5 – 3.5 L'}
              </p>
              <p className="text-xs font-medium text-blue-500 mt-1">
                Drink consistently throughout the day. Add 500ml extra per hour of training. Coconut water is excellent for electrolyte replacement.
              </p>
            </div>
          </div>

          {/* ── Sport Tips ── */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
            <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
              <Trophy size={16} className="text-orange-500" /> Nutrition Tips for {sportMeta.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plan.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
                  <span className={`w-7 h-7 ${sportMeta.tag} text-white rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0`}>
                    {i + 1}
                  </span>
                  <p className="text-xs font-medium text-gray-600 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Disclaimer ── */}
          <p className="text-center text-[11px] font-medium text-gray-300 pb-4">
            Meal plans are general nutritional guidelines for SLIIT student athletes. Consult the SLIIT Sports Unit or a registered dietitian for personalised advice.
          </p>
        </>
      ) : (
        /* ── Empty State ── */
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-20 h-20 bg-orange-50 rounded-[30px] flex items-center justify-center mb-5">
            <Salad size={36} className="text-orange-400" />
          </div>
          <p className="font-bold text-gray-700 text-lg">Select your sport and age group</p>
          <p className="text-sm font-medium text-gray-400 mt-1 max-w-sm">
            Your personalised daily meal plan with calorie targets and macro breakdown will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default HealthMealPlanPage;
