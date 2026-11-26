// Frontend/src/utils/routinePdf.ts
// Generates a clean, multi-page downloadable A4 PDF with embedded Asana illustrations (PNG rasterized from SVG/HF PNGs)
import { DailyRoutineTrackerData } from "../types";

async function rasterizeImageToPng(imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Image load failed"));
      el.src = imageUrl;
    });

    const targetW = 240;
    const targetH = 170;
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Warm matte studio backdrop ensures black-line SVGs and transparent PNGs always render crisp
    ctx.fillStyle = "#FAF9F6";
    ctx.fillRect(0, 0, targetW, targetH);

    const naturalW = img.naturalWidth || targetW;
    const naturalH = img.naturalHeight || targetH;
    const scale = Math.min((targetW - 20) / naturalW, (targetH - 20) / naturalH);
    const drawW = naturalW * scale;
    const drawH = naturalH * scale;
    ctx.drawImage(img, (targetW - drawW) / 2, (targetH - drawH) / 2, drawW, drawH);

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export async function exportRoutineToPdf(data: DailyRoutineTrackerData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = 14;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageH - 16) {
      doc.addPage();
      y = 16;
    }
  };

  // Pre-rasterize all Asana images in parallel cleanly
  const poseImages = await Promise.all(
    (data.recommendedAsanas || []).map((a) => rasterizeImageToPng(a.imageUrl))
  );

  // ── 1. Brand Header Banner ───────────────────────────────────────────
  doc.setFillColor(30, 30, 46);
  doc.roundedRect(margin, y, contentW, 28, 3, 3, "F");
  doc.setFillColor(255, 45, 111);
  doc.rect(margin, y, contentW, 2.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("YOGASHRINI PERSONALIZED DAILY ROUTINE & DIET TRACKER", margin + 5, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(226, 232, 240);
  doc.text(
    `Practitioner: ${data.studentName}   |   Goal: ${data.goalLabel}   |   Diet: ${data.dietPreference.replace("_", "-")}`,
    margin + 5,
    y + 17
  );
  doc.text(
    `Generated: ${new Date(data.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}   |   Clinical Nutrition & Yoga RAG`,
    margin + 5,
    y + 23
  );
  y += 34;

  // ── 2. Anthropometric & Calorie Summary Strip ────────────────────────
  doc.setTextColor(30, 30, 46);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("1. Biometric Calibration & Daily Nutrition Targets", margin, y);
  y += 4;

  const m = data.metrics;
  const statBoxes = [
    { label: "Height / Weight", val: `${m.heightCm} cm / ${m.weightKg} kg` },
    { label: "BMI Status", val: `${m.bmi} (${m.globalBmiCategory})` },
    { label: "BMR / TDEE", val: `${m.bmr} / ${m.tdee} kcal` },
    { label: "Daily Target", val: `${m.targetCalories} kcal/day` },
    { label: "Macros (P / C / F)", val: `${m.macros.proteinG}g / ${m.macros.carbsG}g / ${m.macros.fatsG}g` },
    { label: "Hydration & Burn", val: `${m.hydrationLiters} L | ~${m.sessionCaloriesBurned} kcal` },
  ];

  const boxW = (contentW - 8) / 3;
  const boxH = 14;
  statBoxes.forEach((b, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const bx = margin + col * (boxW + 4);
    const by = y + row * (boxH + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(bx, by, boxW, boxH, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(b.label.toUpperCase(), bx + 3, by + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 46);
    doc.text(b.val, bx + 3, by + 11);
  });
  y += 2 * (boxH + 3) + 4;

  // Clinical Summary Paragraph
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  const sumLines = doc.splitTextToSize(data.summary, contentW);
  doc.text(sumLines, margin, y);
  y += sumLines.length * 4.2 + 5;

  // ── 3. Recommended Asanas with Embedded Illustrations ────────────────
  ensureSpace(24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 46);
  doc.text("2. Prescribed Daily Asana Sequence (with Posture Guides)", margin, y);
  y += 5;

  const cardH = 34;
  for (let i = 0; i < (data.recommendedAsanas || []).length; i++) {
    const a = data.recommendedAsanas[i];
    ensureSpace(cardH + 4);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentW, cardH, 2.5, 2.5, "FD");

    // Pose Illustration Box
    const imgData = poseImages[i];
    if (imgData) {
      doc.addImage(imgData, "PNG", margin + 3, y + 3, 38, cardH - 6);
    } else {
      doc.setFillColor(243, 241, 236);
      doc.roundedRect(margin + 3, y + 3, 38, cardH - 6, 1.5, 1.5, "F");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(a.sanskritName.slice(0, 16), margin + 22, y + cardH / 2, { align: "center" });
    }

    const tx = margin + 45;
    const tw = contentW - 48;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 45, 111);
    doc.text(`${i + 1}. ${a.sanskritName} (${a.englishName})`, tx, y + 7);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(124, 58, 237);
    doc.text(`${a.phase}   |   ${a.duration}   |   ${a.caloriesEst}`, tx, y + 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(51, 65, 85);
    const cueLines = doc.splitTextToSize(`Cue: ${a.alignmentCue} Benefit: ${a.benefit}`, tw).slice(0, 3);
    doc.text(cueLines, tx, y + 17.5);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(185, 28, 28);
    const warnLines = doc.splitTextToSize(`Caution: ${a.contraindication}`, tw).slice(0, 1);
    doc.text(warnLines, tx, y + cardH - 3.5);

    y += cardH + 3.5;
  }

  // ── 4. Full-Day Routine Checklist Timeline ───────────────────────────
  ensureSpace(26);
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 46);
  doc.text("3. Full-Day Hourly Routine Tracker (Printable Checkboxes)", margin, y);
  y += 5;

  for (const slot of data.dailySchedule || []) {
    const detLines = doc.splitTextToSize(slot.details, contentW - 38);
    const rowH = Math.max(12, detLines.length * 4 + 7);
    ensureSpace(rowH + 2);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentW, rowH, 1.5, 1.5, "FD");

    // Empty printable checkbox
    doc.setDrawColor(124, 58, 237);
    doc.rect(margin + 3, y + 3.5, 4, 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 46);
    doc.text(`${slot.timeSlot}  -  ${slot.blockTitle}`, margin + 10, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105);
    doc.text(slot.metric || slot.category, pageW - margin - 3, y + 6, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(detLines, margin + 10, y + 10.5);

    y += rowH + 2.5;
  }

  // ── 5. Structured Meal & Nutrition Plan ──────────────────────────────
  ensureSpace(26);
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 46);
  doc.text("4. Prescribed Evidence-Based Diet & Meal Plan", margin, y);
  y += 5;

  for (const meal of data.dietPlan || []) {
    const itemsText = (meal.items || []).map((it) => `- ${it}`).join("   ");
    const mealLines = doc.splitTextToSize(`${itemsText} (${meal.rationale})`, contentW - 6);
    const mh = Math.max(14, mealLines.length * 4 + 8);
    ensureSpace(mh + 3);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentW, mh, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(124, 58, 237);
    doc.text(`${meal.timing}  |  ${meal.mealName}`, margin + 3, y + 5.5);

    doc.setTextColor(255, 45, 111);
    doc.text(`${meal.calories} kcal  |  ${meal.proteinG}g protein`, pageW - margin - 3, y + 5.5, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81);
    doc.text(mealLines, margin + 3, y + 10);

    y += mh + 2.5;
  }

  // ── 6. Safety Notes & Scientific Sources ─────────────────────────────
  ensureSpace(24);
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(185, 28, 28);
  doc.text("Clinical Safety Notes & Scientific References", margin, y);
  y += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);
  for (const note of [...(data.safetyNotes || []), ...(data.citations || []).slice(0, 3).map((c) => `Source: ${c}`)]) {
    const lines = doc.splitTextToSize(`- ${note}`, contentW);
    ensureSpace(lines.length * 3.8 + 2);
    doc.text(lines, margin, y);
    y += lines.length * 3.8 + 1;
  }

  const fileGoal = (data.metrics.goal || "routine").replace(/[^a-z0-9]+/gi, "_");
  doc.save(`Yogashrini_Daily_Routine_${fileGoal}.pdf`);
}
