// Server/services/routine_planner_service.js
// Anthropometric Energy Balance (Mifflin-St Jeor, WHO/Asian BMI, ICMR-NIN/ACSM Macros, Compendium METs)
// Grounded via Yogashrini Metabolic & Therapeutic Asana RAG Corpus

const ragService = require("./rag_service");
const aiGateway = require("./ai_gateway");
const asanaMediaService = require("./asana_media_service");

function clamp(val, min, max, fallback) {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function classifyGlobalBMI(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25.0) return "Normal Weight";
  if (bmi < 30.0) return "Overweight";
  return "Obesity Class";
}

function classifyAsianBMI(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 23.0) return "Normal (Asia-Pacific)";
  if (bmi < 25.0) return "Overweight Risk (Asia-Pacific)";
  return "Obesity Risk (Asia-Pacific)";
}

function computeBiometrics({
  weightKg = 68,
  heightCm = 170,
  age = 28,
  sex = "male",
  goal = "weight_loss",
  activityLevel = "moderate",
  durationMinutes = 35,
}) {
  const w = clamp(weightKg, 30, 250, 68);
  const h = clamp(heightCm, 100, 240, 170);
  const ageYears = clamp(age, 12, 95, 28);
  const dur = clamp(durationMinutes, 15, 90, 35);
  const normalizedSex = String(sex || "male").toLowerCase() === "female" ? "female" : "male";

  const bmi = Number((w / Math.pow(h / 100, 2)).toFixed(1));
  const globalBmiCategory = classifyGlobalBMI(bmi);
  const asianBmiCategory = classifyAsianBMI(bmi);

  // Mifflin-St Jeor (1990)
  const sexOffset = normalizedSex === "female" ? -161 : 5;
  const bmr = Math.round(10 * w + 6.25 * h - 5 * ageYears + sexOffset);

  const activityMap = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
  };
  const multiplier = activityMap[activityLevel] || 1.55;
  const tdee = Math.round(bmr * multiplier);

  const normGoal =
    goal === "weight_gain" || goal === "weight_loss" ? goal : "maintain";

  let targetCalories = tdee;
  let calorieDeltaLabel = "Maintenance (Isocaloric)";
  const calorieFloor = normalizedSex === "female" ? 1200 : 1500;
  let floorApplied = false;

  if (normGoal === "weight_loss") {
    const rawTarget = tdee - 450;
    if (rawTarget < calorieFloor) {
      targetCalories = calorieFloor;
      floorApplied = true;
    } else {
      targetCalories = rawTarget;
    }
    calorieDeltaLabel = `-${tdee - targetCalories} kcal/day Deficit (Target ~0.4 kg/wk loss)`;
  } else if (normGoal === "weight_gain") {
    targetCalories = tdee + 400;
    calorieDeltaLabel = "+400 kcal/day Controlled Surplus (Lean Tissue Gain)";
  }

  const proteinPerKg = normGoal === "weight_gain" ? 1.6 : normGoal === "weight_loss" ? 1.4 : 1.1;
  const proteinG = Math.round(w * proteinPerKg);
  const fatPct = normGoal === "weight_gain" ? 0.28 : 0.25;
  const fatsG = Math.round((targetCalories * fatPct) / 9);
  const remainingCals = Math.max(240, targetCalories - proteinG * 4 - fatsG * 9);
  const carbsG = Math.round(remainingCals / 4);
  const fiberG =
    normGoal === "weight_loss"
      ? Math.round(Math.max(28, (targetCalories / 1000) * 16))
      : Math.round(Math.max(24, (targetCalories / 1000) * 14));

  const metValue = normGoal === "weight_loss" ? 3.8 : normGoal === "weight_gain" ? 2.8 : 3.0;
  const sessionCaloriesBurned = Math.round(((metValue * w * 3.5) / 200) * dur);
  const hydrationLiters = Number((w * 0.035 + (dur / 60) * 0.45).toFixed(1));

  return {
    weightKg: w,
    heightCm: h,
    age: ageYears,
    sex: normalizedSex,
    bmi,
    globalBmiCategory,
    asianBmiCategory,
    bmr,
    tdee,
    targetCalories,
    calorieFloor,
    floorApplied,
    calorieDeltaLabel,
    macros: {
      proteinG,
      carbsG,
      fatsG,
      fiberG,
      proteinPerKg,
    },
    metValue,
    sessionCaloriesBurned,
    hydrationLiters,
    durationMinutes: dur,
    goal: normGoal,
    activityLevel,
  };
}

function buildDeterministicPlan({ metrics, dietPreference, focusNote }) {
  const isGain = metrics.goal === "weight_gain";
  const isLoss = metrics.goal === "weight_loss";
  const isVeg = dietPreference === "vegetarian";
  const isEgg = dietPreference === "eggetarian";
  const cals = metrics.targetCalories;
  const p = metrics.macros.proteinG;

  const dietPlan = isLoss
    ? [
        {
          mealName: "Pre-Practice Wake-Up & Hydration",
          timing: "06:30 AM",
          calories: 40,
          proteinG: 1,
          items: [
            "350 mL warm lemon water or tulsi-ginger infusion",
            "4 soaked almonds & 1 walnut half",
          ],
          rationale: "Rehydrates before morning metabolic flow without heavy gastric load.",
        },
        {
          mealName: "High-Satiety Protein Breakfast",
          timing: "08:15 AM",
          calories: Math.round(cals * 0.25),
          proteinG: Math.round(p * 0.28),
          items: isVeg
            ? ["2 moong dal chillas stuffed with grated paneer (80g) & spinach", "Mint coriander chutney & unsweetened green tea"]
            : isEgg
            ? ["2 boiled eggs + 1 egg white vegetable omelette", "1 multigrain toast + sautéed bell peppers"]
            : ["2 egg whites + grilled herb chicken (80g) or oats porridge", "1 small apple & flaxseeds (1 tsp)"],
          rationale: "Front-loads protein to blunt mid-morning ghrelin hunger spikes (ACSM/ICMR guideline).",
        },
        {
          mealName: "Structured High-Fiber Balanced Lunch",
          timing: "01:00 PM",
          calories: Math.round(cals * 0.35),
          proteinG: Math.round(p * 0.35),
          items: isVeg
            ? ["50% plate raw/steamed cruciferous & leafy salad", "2 jowar/ragi rotis + 1.5 katori yellow moong dal + low-fat curd (150g)"]
            : ["50% plate steamed greens & cucumber-tomato salad", "120g grilled fish/chicken OR dal-palak + 100g brown rice/2 millet rotis + curd"],
          rationale: "Follows ICMR-NIN / Harvard Healthy Eating Plate with soluble fiber and 3:1 grain-pulse pairing.",
        },
        {
          mealName: "Evening Metabolic Snack",
          timing: "05:00 PM",
          calories: Math.round(cals * 0.14),
          proteinG: Math.round(p * 0.14),
          items: [
            "Roasted chana (35g) or sprouted moong chaat with lemon & cucumber",
            "200 mL spiced buttermilk (chaas)",
          ],
          rationale: "Sustains evening blood sugar ahead of gentle twilight mobility practice.",
        },
        {
          mealName: "Light Cortisol-Calming Dinner",
          timing: "07:45 PM",
          calories: Math.round(cals * 0.26),
          proteinG: Math.round(p * 0.23),
          items: isVeg
            ? ["100g grilled tofu or low-fat paneer tikka with sautéed broccoli & zucchini", "1 small bowl vegetable clear dal soup"]
            : ["120g steamed fish or egg-bhurji (2 whites + 1 whole) with roasted seasonal vegetables", "Clear ginger-garlic broth"],
          rationale: "Low glycemic load at dusk prevents nocturnal insulin surges and preserves restorative sleep.",
        },
      ]
    : isGain
    ? [
        {
          mealName: "Morning Agni & Calorie-Dense Pre-Fuel",
          timing: "06:30 AM",
          calories: Math.round(cals * 0.12),
          proteinG: Math.round(p * 0.10),
          items: [
            "6 soaked almonds, 2 soaked walnuts, 2 dates & 1 ripe banana",
            "Warm water with soaked chia/pumpkin seeds (wait 20 min before asana)",
          ],
          rationale: "Supplies glycogen energy without bulky fiber distension prior to strength holds.",
        },
        {
          mealName: "Anabolic Whole-Food Breakfast",
          timing: "08:15 AM",
          calories: Math.round(cals * 0.25),
          proteinG: Math.round(p * 0.25),
          items: isVeg
            ? ["Whole-grain vegetable dalia or 2 stuffed paneer parathas cooked with 1 tsp cow ghee", "Dense smoothie: 250 mL whole/soy milk + 2 tbsp peanut butter + oats + roasted sattu"]
            : isEgg
            ? ["3 whole eggs bhurji with 2 multigrain toasts + avocado/ghee drizzle", "250 mL banana-peanut butter milk smoothie"]
            : ["3 eggs omelette with cheese + 2 whole-wheat toasts", "250 mL banana-oats-almond butter shake"],
          rationale: "Liquid-plus-solid calorie density delivers +250-350 kcal cleanly without early satiety (ICMR/Harvard surplus strategy).",
        },
        {
          mealName: "Complete Amino Acid Surplus Lunch + Post-Meal Vajrasana",
          timing: "01:00 PM",
          calories: Math.round(cals * 0.30),
          proteinG: Math.round(p * 0.32),
          items: isVeg
            ? ["1.5 cups brown rice + thick rajma or chana masala with 1.5 tsp cold-pressed oil/ghee", "Paneer bhurji (100g) + thick bowl dahi (curd) + cooked warm greens"]
            : ["1.5 cups rice + 150g chicken/fish curry or paneer + thick dal tadka (1 tsp ghee)", "Bowl full-fat curd + cooked lightly spiced carrots & beans"],
          rationale: "3:1 grain-legume ratio supplies complete essential amino acids; follow immediately with 5-10 min Vajrasana for splanchnic absorption.",
        },
        {
          mealName: "Calorie-Dense Afternoon Builder Snack",
          timing: "04:45 PM",
          calories: Math.round(cals * 0.14),
          proteinG: Math.round(p * 0.15),
          items: [
            "2 tbsp natural peanut/almond butter on sourdough toast OR roasted makhana & cashew mix",
            "Lassi / soy protein smoothie (250 mL)",
          ],
          rationale: "Nut butters supply ~550-600 kcal/100g in compact volume to overcome plant-fiber satiety.",
        },
        {
          mealName: "Restorative Strength Dinner & Pre-Sleep Recovery",
          timing: "08:00 PM",
          calories: Math.round(cals * 0.19),
          proteinG: Math.round(p * 0.18),
          items: isVeg
            ? ["2 whole-wheat rotis + palak paneer (120g) + moong khichdi drizzle of ghee", "Bedtime: 200 mL warm turmeric milk (haldi doodh) with crushed cardamom"]
            : ["2 multigrain rotis + grilled salmon/chicken/egg curry + sautéed sweet potato", "Bedtime: 200 mL warm turmeric milk"],
          rationale: "Slow-digesting casein/soy protein supports overnight muscle protein synthesis during sleep.",
        },
      ]
    : [
        {
          mealName: "Morning Hydration & Mindful Breakfast",
          timing: "08:00 AM",
          calories: Math.round(cals * 0.25),
          proteinG: Math.round(p * 0.25),
          items: isVeg
            ? ["Steel-cut oats with chia seeds, berries, 6 almonds, and soy/dairy milk", "1 bowl vegetable poha with roasted peanuts"]
            : ["2 eggs poached/scrambled with sautéed spinach & 2 whole-grain toasts", "Herbal tea + seasonal fruit"],
          rationale: "Isocaloric balance stabilizing blood glucose and neuromuscular energy.",
        },
        {
          mealName: "Balanced ICMR-Harvard Lunch",
          timing: "01:00 PM",
          calories: Math.round(cals * 0.35),
          proteinG: Math.round(p * 0.35),
          items: isVeg
            ? ["Half plate mixed vegetables, quarter whole grains/2 rotis, quarter dal + 80g paneer + curd"]
            : ["Half plate colorful vegetables, 1 cup brown rice, quarter lean fish/chicken or dal + curd"],
          rationale: "Preserves body composition while providing sustained afternoon clarity.",
        },
        {
          mealName: "Afternoon Micronutrient Snack",
          timing: "04:45 PM",
          calories: Math.round(cals * 0.15),
          proteinG: Math.round(p * 0.15),
          items: ["Handful of roasted seeds & mixed nuts + seasonal fruit", "Lemon-ginger herbal infusion"],
          rationale: "Prevents evening fatigue before restorative practice.",
        },
        {
          mealName: "Nourishing Digestive Dinner",
          timing: "07:45 PM",
          calories: Math.round(cals * 0.25),
          proteinG: Math.round(p * 0.25),
          items: isVeg
            ? ["Warm vegetable-lentil soup, sautéed tofu/paneer (90g), and millet bhakri/roti"]
            : ["Grilled protein portion with roasted root vegetables and lentil soup"],
          rationale: "Gentle evening digestion aligned with circadian melatonin onset.",
        },
      ];

  const recommendedAsanasRaw = isLoss
    ? [
        {
          sanskritName: "Surya Namaskar",
          englishName: "Sun Salutation Flow",
          phase: "Warm-Up & Aerobic Ignition",
          duration: "8-12 continuous rounds (10 min)",
          caloriesEst: `${Math.round(metrics.sessionCaloriesBurned * 0.38)} kcal`,
          alignmentCue: "Sync inhale with spinal extension and exhale cleanly through transitions without lumbar collapse.",
          benefit: "Operates at 3.5-5.3 METs (60-70% max HR), elevating lipid oxidation and insulin sensitivity.",
          contraindication: "Modify onto knees/forearms in carpal tunnel, acute lower back disc injury, or uncontrolled hypertension.",
        },
        {
          sanskritName: "Utkatasana",
          englishName: "Chair Pose",
          phase: "Primary Metabolic Hold",
          duration: "3 sets x 30-45 sec",
          caloriesEst: `${Math.round(metrics.sessionCaloriesBurned * 0.18)} kcal`,
          alignmentCue: "Sit hips back behind heels, draw lower ribs inward, and keep knees stacked over mid-foot.",
          benefit: "Engages large quadriceps and gluteal glycogen stores, upregulating peripheral glucose clearance.",
          contraindication: "Reduce flexion depth or use wall-sit support during knee meniscus or patellar irritation.",
        },
        {
          sanskritName: "Navasana",
          englishName: "Boat Pose",
          phase: "Core Thermal Conditioning",
          duration: "3 rounds x 25-35 sec",
          caloriesEst: `${Math.round(metrics.sessionCaloriesBurned * 0.15)} kcal`,
          alignmentCue: "Balance evenly on sitting bones with lifted sternum and relaxed shoulders away from ears.",
          benefit: "Strengthens transverse abdominis and hip flexors without jerking cervical/lumbar vertebrae.",
          contraindication: "Bend knees (Ardha Navasana) in hamstring tightness or avoid during acute lumbar disc pain.",
        },
        {
          sanskritName: "Virabhadrasana II",
          englishName: "Warrior Two",
          phase: "Endurance & Hip Stability",
          duration: "45 sec per side x 2 rounds",
          caloriesEst: `${Math.round(metrics.sessionCaloriesBurned * 0.15)} kcal`,
          alignmentCue: "Track front knee directly over the second toe at 90 degrees while rooting through outer rear heel.",
          benefit: "Sustains moderate cardiac demand while toning lower kinetic chain musculature.",
          contraindication: "Shorten stance during medial collateral ligament tenderness or hip impingement.",
        },
        {
          sanskritName: "Ardha Matsyendrasana",
          englishName: "Half Lord of the Fishes",
          phase: "Visceral Reset & Cooldown",
          duration: "45 sec per side",
          caloriesEst: `${Math.round(metrics.sessionCaloriesBurned * 0.08)} kcal`,
          alignmentCue: "Lengthen spine upward on inhale before rotating smoothly from the thoracic ribcage.",
          benefit: "Massages hepatic and intestinal viscera while shifting tone toward parasympathetic recovery.",
          contraindication: "Keep twist gentle/open during spinal disc pathology or pregnancy.",
        },
      ]
    : isGain
    ? [
        {
          sanskritName: "Phalakasana",
          englishName: "Plank Pose",
          phase: "Isometric Hypertrophy Stimulus",
          duration: "3 rounds x 30-45 sec",
          caloriesEst: "Controlled lean stimulus",
          alignmentCue: "Stack wrists cleanly beneath shoulders, engage glutes and anterior core, maintain a straight neutral trunk.",
          benefit: "Maximizes upper-body & core time-under-tension to channel caloric surplus into lean muscle accrual.",
          contraindication: "Perform Forearm Plank in carpal tunnel or wrist extensor strain.",
        },
        {
          sanskritName: "Virabhadrasana I",
          englishName: "Warrior One",
          phase: "Lower-Body Strength Building",
          duration: "45 sec per side x 2 sets",
          caloriesEst: "Controlled strength hold",
          alignmentCue: "Press back outer heel firmly into mat, bend front knee cleanly to 90 degrees over ankle.",
          benefit: "Builds quadriceps, gluteal, and postural back muscle density alongside dietary protein.",
          contraindication: "Keep hands at heart center if hypertensive; avoid lumbar hyper-arching.",
        },
        {
          sanskritName: "Bhujangasana",
          englishName: "Cobra Pose",
          phase: "Endocrine & Agni Activation",
          duration: "3 holds x 20-30 sec",
          caloriesEst: "Thyroid & digestive tone",
          alignmentCue: "Lift chest gently using spinal extensors rather than arm lock; draw elbows close to ribs.",
          benefit: "Enhances thyroid/anterior neck vascularity and awakens digestive appetite gently.",
          contraindication: "Use low Sphinx Pose during lower-back stiffness or hernia recovery.",
        },
        {
          sanskritName: "Setu Bandhasana",
          englishName: "Bridge Pose",
          phase: "Posterior Chain Activation",
          duration: "3 holds x 35-45 sec",
          caloriesEst: "Glute & spine density",
          alignmentCue: "Plant feet hip-width apart parallel; drive hips upward keeping thighs parallel and neck still.",
          benefit: "Strengthens gluteus maximus, hamstrings, and erector spinae while calming nervous overdrive.",
          contraindication: "Do not turn head sideways once hips lift; keep cervical spine neutral.",
        },
        {
          sanskritName: "Vajrasana",
          englishName: "Thunderbolt Pose",
          phase: "Post-Meal Digestive Anchor",
          duration: "5-10 min after lunch & dinner",
          caloriesEst: "Restorative absorption",
          alignmentCue: "Sit comfortably on heels with tall spine and slow belly breathing after main meals.",
          benefit: "Redirects splanchnic blood flow toward stomach/intestines to optimize caloric & protein absorption.",
          contraindication: "Tuck a cushion beneath hips/ankles if knees feel compressed; avoid in acute knee arthritis.",
        },
      ]
    : [
        {
          sanskritName: "Vrikshasana",
          englishName: "Tree Pose",
          phase: "Neuromuscular Balance",
          duration: "45 sec each leg x 2",
          caloriesEst: `${Math.round(metrics.sessionCaloriesBurned * 0.16)} kcal`,
          alignmentCue: "Press foot firmly into inner thigh or calf (never knee joint); keep pelvis level.",
          benefit: "Improves unilateral joint proprioception, posture symmetry, and calm focus.",
          contraindication: "Keep foot low on calf or use wall support if dizzy.",
        },
        {
          sanskritName: "Adho Mukha Svanasana",
          englishName: "Downward-Facing Dog",
          phase: "Axial Spinal Decompression",
          duration: "2 holds x 45 sec",
          caloriesEst: `${Math.round(metrics.sessionCaloriesBurned * 0.22)} kcal`,
          alignmentCue: "Spread fingers actively, bend knees slightly if hamstrings pull, lengthen spine from wrists to hips.",
          benefit: "Balanced upper-lower chain strengthening and posterior chain elongation.",
          contraindication: "Modify onto forearms (Dolphin) in wrist carpal tunnel.",
        },
        {
          sanskritName: "Virabhadrasana II",
          englishName: "Warrior Two",
          phase: "Functional Hip Strength",
          duration: "45 sec per side",
          caloriesEst: `${Math.round(metrics.sessionCaloriesBurned * 0.24)} kcal`,
          alignmentCue: "Stack front knee cleanly over ankle, lengthen horizontally across both arms.",
          benefit: "Builds functional leg endurance and opens tight hip flexors.",
          contraindication: "Shorten stance if medial knee feels tight.",
        },
        {
          sanskritName: "Setu Bandhasana",
          englishName: "Bridge Pose",
          phase: "Posterior Chain & Chest Open",
          duration: "3 rounds x 30 sec",
          caloriesEst: `${Math.round(metrics.sessionCaloriesBurned * 0.18)} kcal`,
          alignmentCue: "Lift sternum cleanly without over-squeezing knees outward.",
          benefit: "Counters desk rounding and activates gluteal stabilizers.",
          contraindication: "Keep cervical spine centered and neutral.",
        },
        {
          sanskritName: "Savasana",
          englishName: "Corpse Pose",
          phase: "Autonomic Recovery",
          duration: "6-8 minutes",
          caloriesEst: "Cortisol reset",
          alignmentCue: "Rest flat with palms relaxed upward and slow nasal exhalations.",
          benefit: "Consolidates neuromuscular balance and regulates HPA-axis stress hormones.",
          contraindication: "Place bolster under knees if lower back feels arched.",
        },
      ];

  const dailySchedule = [
    {
      id: "wake_hydrate",
      timeSlot: "06:30 AM",
      blockTitle: "Morning Hydration & Gentle Activation",
      category: "Hydration",
      details: isLoss
        ? "350 mL warm lemon/herbal water + light joint rotations prior to morning flow."
        : isGain
        ? "Warm water + soaked almonds, dates & banana to prime glycogen before strength holds."
        : "350 mL water + 5 minutes nasal clearing & spinal cat-cow mobilization.",
      metric: "350 mL Fluid",
    },
    {
      id: "morning_asana",
      timeSlot: "06:50 AM",
      blockTitle: isLoss
        ? "Primary Metabolic Yoga & Breathwork"
        : isGain
        ? "Strength & Hypertrophy Asana Protocol"
        : "Balanced Hatha-Vinyasa Practice",
      category: "Yoga",
      details: `${metrics.durationMinutes} min sequence featuring ${recommendedAsanasRaw
        .slice(0, 4)
        .map((a) => a.sanskritName)
        .join(", ")} + ${isLoss ? "energizing Kapalbhati (if BP normal) / Ujjayi" : "Nadi Shodhana"}.`,
      metric: `~${metrics.sessionCaloriesBurned} kcal · ${metrics.durationMinutes} min`,
    },
    {
      id: "breakfast",
      timeSlot: "08:15 AM",
      blockTitle: dietPlan[1]?.mealName || "Morning Meal",
      category: "Meal",
      details: (dietPlan[1]?.items || []).join(" | "),
      metric: `${dietPlan[1]?.calories || 450} kcal · ${dietPlan[1]?.proteinG || 20}g Protein`,
    },
    {
      id: "lunch_vajrasana",
      timeSlot: "01:00 PM",
      blockTitle: "Wholesome Lunch + Post-Meal Vajrasana",
      category: "Meal",
      details: `${(dietPlan[isGain ? 2 : isLoss ? 2 : 1]?.items || []).join(" | ")} — followed by 5-10 minutes upright Vajrasana breathing.`,
      metric: `${dietPlan[isGain ? 2 : isLoss ? 2 : 1]?.calories || 600} kcal`,
    },
    {
      id: "evening_snack",
      timeSlot: "04:45 PM",
      blockTitle: isGain ? "Calorie-Dense Afternoon Builder" : "Fiber & Protein Metabolic Snack",
      category: "Meal",
      details: (dietPlan[isGain ? 3 : isLoss ? 3 : 2]?.items || []).join(" | "),
      metric: `${dietPlan[isGain ? 3 : isLoss ? 3 : 2]?.calories || 250} kcal`,
    },
    {
      id: "evening_recovery",
      timeSlot: "06:15 PM",
      blockTitle: isLoss
        ? "20-Min Evening Walk & Restorative Stretch"
        : "Cortisol Reset & Parasympathetic Pranayama",
      category: "Pranayama",
      details: isGain
        ? "12 minutes of Paschimottanasana, Balasana & Bhramari Pranayama to suppress catabolic cortisol."
        : "Brisk 20-minute post-day walk + gentle Paschimottanasana & Savasana decompression.",
      metric: "15-20 min Reset",
    },
    {
      id: "dinner_sleep",
      timeSlot: "07:45 PM - 10:15 PM",
      blockTitle: "Light Dinner & Sleep Recovery Window",
      category: "Recovery",
      details: `${(dietPlan[dietPlan.length - 1]?.items || []).join(" | ")}. Target ${metrics.hydrationLiters}L total daily water and 7.5-8.5 hrs sleep.${
        focusNote ? ` Custom focus integrated: ${focusNote}.` : ""
      }`,
      metric: "7.5-8.5 hrs Sleep",
    },
  ];

  const nutritionTips = isGain
    ? [
        "Pair cereals/millets and legumes at a ~3:1 ratio (ICMR-NIN) for complete amino acid profiles.",
        "Limit raw salad bulk immediately prior to dense meals; use cooked vegetables and nut-butter smoothies to hit surplus comfortably.",
        "Add 1-2 tsp cold-pressed oil or ghee per main meal and hydrate mostly between meals rather than filling the stomach right before eating.",
      ]
    : isLoss
    ? [
        "Fill half of lunch and dinner plates with fibrous low-calorie vegetables (Harvard/ICMR My Plate) before adding grains and protein.",
        `Maintain ${metrics.macros.proteinG}g/day protein (~${metrics.macros.proteinPerKg} g/kg) alongside dynamic Warrior/Chair holds to protect lean muscle tissue.`,
        "Drink 350 mL water 25 minutes before meals and eliminate sugary drinks and refined flour snacks.",
      ]
    : [
        "Distribute protein across 4 balanced feedings totaling ~" + metrics.macros.proteinG + "g/day.",
        "Pair morning movement with evening parasympathetic breathwork to stabilize cortisol and sleep.",
      ];

  const safetyNotes = [
    metrics.floorApplied
      ? `Caloric intake was automatically clamped at the clinical minimum safety floor (${metrics.calorieFloor} kcal/day) per ACSM/NIH guidelines.`
      : `Daily caloric target (${metrics.targetCalories} kcal/day) represents a safe, sustainable adjustment from estimated TDEE (${metrics.tdee} kcal/day).`,
    "Predictive Mifflin-St Jeor equations carry roughly +/-10% individual variance; monitor weekly weight trends over 2-3 weeks and adjust by 100-150 kcal if needed.",
    "Individuals with hypertension, spinal disc herniation, hernias, pregnancy, or acute joint injury must substitute modified props or skip rapid inversions/Kapalbhati.",
  ];

  return {
    summary: isLoss
      ? `Evidence-grounded Weight Loss & Metabolic Optimization tracker tailored for ${metrics.weightKg} kg / ${metrics.heightCm} cm (BMI ${metrics.bmi}, ${metrics.asianBmiCategory}). Pairs a safe ${metrics.targetCalories} kcal/day high-protein ICMR-NIN/Harvard deficit diet with ${metrics.durationMinutes}-minute Surya Namaskar and strength flows (~${metrics.sessionCaloriesBurned} kcal/session).`
      : isGain
      ? `Lean Mass & Digestive Recovery tracker tailored for ${metrics.weightKg} kg / ${metrics.heightCm} cm (BMI ${metrics.bmi}, ${metrics.globalBmiCategory}). Combines a controlled +400 kcal/day whole-food surplus (${metrics.targetCalories} kcal/day, ${metrics.macros.proteinG}g protein) with isometric strength poses, post-meal Vajrasana, and cortisol-lowering pranayama.`
      : `Balanced Recomposition & Mobility daily tracker tailored for ${metrics.weightKg} kg / ${metrics.heightCm} cm (BMI ${metrics.bmi}). Balances maintenance nutrition (${metrics.targetCalories} kcal/day) with Hatha-Vinyasa mobility and restorative recovery.`,
    dailySchedule,
    dietPlan,
    recommendedAsanas: recommendedAsanasRaw,
    nutritionTips,
    safetyNotes,
  };
}

async function generateDailyTracker(input = {}, apiBase = "http://localhost:2000") {
  const metrics = computeBiometrics(input);
  const dietPreference = ["vegetarian", "eggetarian", "non_vegetarian"].includes(input.dietPreference)
    ? input.dietPreference
    : "vegetarian";
  const focusNote = String(input.focusNote || "").trim().slice(0, 140);
  const studentName = String(input.studentName || "Practitioner").trim().slice(0, 80) || "Practitioner";

  // 1. Retrieve grounded chunks from newly generated metabolic + nutrition RAG corpus
  const ragQuery = `${metrics.goal.replace("_", " ")} diet protein calories ${dietPreference} asana splanchnic metabolism pranayama vajrasana surya namaskar`;
  const retrievedChunks = ragService.retrieve(ragQuery, 4);
  const citations = [
    ...new Set([
      ...retrievedChunks.map((c) => c.title),
      "Mifflin-St Jeor (NIH/AJCN 1990) & ACSM Energy Balance Guidelines",
      "ICMR-NIN Dietary Guidelines for Indians (2024) & Harvard Healthy Eating Plate",
      "WHO Global & Asia-Pacific BMI Cutoffs + Compendium of Physical Activities (METs)",
    ]),
  ];

  const ragContextText = retrievedChunks
    .map((c, idx) => `[RAG ${idx + 1}: ${c.title}] ${String(c.content || "").slice(0, 650)}`)
    .join("\n\n");

  const goalLabel =
    metrics.goal === "weight_loss"
      ? "Weight Loss & Metabolic Conditioning"
      : metrics.goal === "weight_gain"
      ? "Healthy Weight Gain & Lean Strength"
      : "Weight Maintenance & Mobility";

  const deterministic = buildDeterministicPlan({ metrics, dietPreference, focusNote });

  const prompt = `Build a personalized daily routine tracker JSON for ${studentName} grounded strictly in the clinical metrics and RAG research below.

VERIFIED METRICS (DO NOT ALTER THESE NUMBERS):
- Weight: ${metrics.weightKg} kg | Height: ${metrics.heightCm} cm | Age: ${metrics.age} | Sex: ${metrics.sex}
- BMI: ${metrics.bmi} kg/m2 (${metrics.globalBmiCategory} / ${metrics.asianBmiCategory})
- Mifflin-St Jeor BMR: ${metrics.bmr} kcal | TDEE: ${metrics.tdee} kcal
- Target Daily Calories: ${metrics.targetCalories} kcal (${metrics.calorieDeltaLabel})
- Daily Macros: Protein ${metrics.macros.proteinG}g, Carbs ${metrics.macros.carbsG}g, Fats ${metrics.macros.fatsG}g, Fiber ${metrics.macros.fiberG}g
- Hydration: ${metrics.hydrationLiters} L/day | Yoga Duration: ${metrics.durationMinutes} min (~${metrics.sessionCaloriesBurned} kcal)
- Goal: ${goalLabel} | Diet Preference: ${dietPreference}${focusNote ? ` | Health/Focus Note: ${focusNote}` : ""}

GROUNDED RAG EVIDENCE:
${ragContextText}

Return ONLY valid JSON with zero markdown fences and ZERO emojis containing:
{
  "summary": "2-sentence personalized clinical + yogic synthesis referencing BMI and calorie target",
  "dailySchedule": [
    { "id": "snake_id", "timeSlot": "06:30 AM", "blockTitle": "...", "category": "Hydration|Yoga|Meal|Pranayama|Recovery", "details": "...", "metric": "..." }
  ],
  "dietPlan": [
    { "mealName": "...", "timing": "...", "calories": 450, "proteinG": 22, "items": ["item 1", "item 2"], "rationale": "..." }
  ],
  "recommendedAsanas": [
    { "sanskritName": "Canonical Sanskrit name e.g. Surya Namaskar, Utkatasana, Navasana, Virabhadrasana II, Phalakasana, Vajrasana, Bhujangasana, Setu Bandhasana, Paschimottanasana, Ardha Matsyendrasana, Vrikshasana", "englishName": "English Name", "phase": "...", "duration": "...", "caloriesEst": "...", "alignmentCue": "...", "benefit": "...", "contraindication": "..." }
  ],
  "nutritionTips": ["tip 1", "tip 2", "tip 3"],
  "safetyNotes": ["note 1", "note 2"]
}
Ensure 6-7 dailySchedule blocks, 4-5 dietPlan meals summing near ${metrics.targetCalories} kcal, and exactly 5 recommendedAsanas appropriate for ${goalLabel} and ${focusNote || "general safety"}.`;

  let plan = null;
  let aiMeta = { model: "yogashrini-metabolic-rag-deterministic", provider: "Clinical RAG Fallback" };

  try {
    const aiResp = await aiGateway.completeChat(
      [
        {
          role: "system",
          content:
            "You are a Clinical Yoga Therapist (C-IAYT) and Registered Sports Dietitian. Output ONLY clean parseable JSON with zero emojis.",
        },
        { role: "user", content: prompt },
      ],
      { temperature: 0.25, max_tokens: 900 }
    );
    aiMeta = { model: aiResp.model, provider: aiResp.provider };
    const cleaned = String(aiResp.content || "")
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
      if (
        Array.isArray(parsed.dailySchedule) &&
        parsed.dailySchedule.length >= 4 &&
        Array.isArray(parsed.dietPlan) &&
        parsed.dietPlan.length >= 3 &&
        Array.isArray(parsed.recommendedAsanas) &&
        parsed.recommendedAsanas.length >= 3
      ) {
        plan = {
          summary: parsed.summary || deterministic.summary,
          dailySchedule: parsed.dailySchedule.map((item, idx) => ({
            id: item.id || `slot_${idx + 1}`,
            timeSlot: item.timeSlot || `Slot ${idx + 1}`,
            blockTitle: item.blockTitle || "Practice Block",
            category: item.category || "Yoga",
            details: item.details || "",
            metric: item.metric || "",
          })),
          dietPlan: parsed.dietPlan,
          recommendedAsanas: parsed.recommendedAsanas.slice(0, 6).map((a) => ({
            ...a,
            caloriesEst: /^\d+(\.\d+)?$/.test(String(a.caloriesEst || "").trim())
              ? `${String(a.caloriesEst).trim()} kcal`
              : String(a.caloriesEst || "Balanced intensity"),
          })),
          nutritionTips: Array.isArray(parsed.nutritionTips) && parsed.nutritionTips.length ? parsed.nutritionTips : deterministic.nutritionTips,
          safetyNotes: Array.isArray(parsed.safetyNotes) && parsed.safetyNotes.length ? parsed.safetyNotes : deterministic.safetyNotes,
        };
      }
    }
  } catch {
    // Fall back cleanly to clinically calibrated RAG plan
  }

  const finalPlan = plan || deterministic;

  // 2. Resolve crisp CORS-safe imageUrl (Canonical 48 Library or Hugging Face generator + vector fallback) for EVERY Asana
  const resolvedAsanas = await Promise.all(
    finalPlan.recommendedAsanas.map(async (asana) => {
      const resolved = await asanaMediaService.resolveAsanaImage({
        poseName: asana.englishName || asana.sanskritName,
        sanskritName: asana.sanskritName || "",
        forceHF: false,
        apiBase,
      });
      return {
        ...asana,
        imageUrl: resolved.imageUrl,
        imageSource: resolved.source,
        imageCaption: resolved.caption,
      };
    })
  );

  return {
    studentName,
    goalLabel,
    dietPreference,
    metrics,
    summary: finalPlan.summary,
    dailySchedule: finalPlan.dailySchedule,
    dietPlan: finalPlan.dietPlan,
    recommendedAsanas: resolvedAsanas,
    nutritionTips: finalPlan.nutritionTips,
    safetyNotes: finalPlan.safetyNotes,
    citations,
    engine: aiMeta,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  generateDailyTracker,
  computeBiometrics,
};
