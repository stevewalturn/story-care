/**
 * Seed Clinical Assessment Instruments
 * Populates PCL-5, HAM-D, PANSS, BAM, and OASIS with actual questions
 */

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as dotenv from 'dotenv';
import { eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  assessmentInstrumentItemsSchema,
  assessmentInstrumentsSchema,
  assessmentResponsesSchema,
} from '../src/models/Schema';
import * as schema from '../src/models/Schema';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db: PostgresJsDatabase<typeof schema> = drizzle(pool, { schema });

// ============================================================================
// INSTRUMENT DEFINITIONS
// ============================================================================

const instruments = [
  // ──────────────────────────────────────────────────────────────────────────
  // 1. PANSS (Positive and Negative Syndrome Scale)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'PANSS',
    fullName: 'Positive and Negative Syndrome Scale',
    instrumentType: 'schizophrenia' as const,
    description: 'A 30-item clinician-rated instrument for measuring severity of psychopathology in adults with schizophrenia.',
    instructions: 'Complete the PANSS assessment by rating each symptom item below for the specified patient and timepoint.',
    scaleMin: 1,
    scaleMax: 7,
    scaleLabels: { 1: 'Absent', 2: 'Minimal', 3: 'Mild', 4: 'Moderate', 5: 'Moderate-Severe', 6: 'Severe', 7: 'Extreme' },
    scoringMethod: 'sum',
    totalScoreRange: { min: 30, max: 210 },
    subscales: [
      { name: 'Positive Scale', items: [1, 2, 3, 4, 5, 6, 7] },
      { name: 'Negative Scale', items: [8, 9, 10, 11, 12, 13, 14] },
      { name: 'General Psychopathology', items: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] },
    ],
    clinicalCutoffs: [
      { min: 30, max: 57, label: 'Mildly Ill', severity: 'mild' },
      { min: 58, max: 74, label: 'Moderately Ill', severity: 'moderate' },
      { min: 75, max: 95, label: 'Markedly Ill', severity: 'marked' },
      { min: 96, max: 115, label: 'Severely Ill', severity: 'severe' },
      { min: 116, max: 210, label: 'Extremely Ill', severity: 'extreme' },
    ],
    items: [
      // Positive Scale (P1–P7)
      { itemNumber: 1, questionText: 'Delusions', subscaleName: 'Positive Scale' },
      { itemNumber: 2, questionText: 'Conceptual Disorganization', subscaleName: 'Positive Scale' },
      { itemNumber: 3, questionText: 'Hallucinatory Behavior', subscaleName: 'Positive Scale' },
      { itemNumber: 4, questionText: 'Excitement', subscaleName: 'Positive Scale' },
      { itemNumber: 5, questionText: 'Grandiosity', subscaleName: 'Positive Scale' },
      { itemNumber: 6, questionText: 'Suspiciousness/Persecution', subscaleName: 'Positive Scale' },
      { itemNumber: 7, questionText: 'Hostility', subscaleName: 'Positive Scale' },
      // Negative Scale (N1–N7)
      { itemNumber: 8, questionText: 'Blunted Affect', subscaleName: 'Negative Scale' },
      { itemNumber: 9, questionText: 'Emotional Withdrawal', subscaleName: 'Negative Scale' },
      { itemNumber: 10, questionText: 'Poor Rapport', subscaleName: 'Negative Scale' },
      { itemNumber: 11, questionText: 'Passive/Apathetic Social Withdrawal', subscaleName: 'Negative Scale' },
      { itemNumber: 12, questionText: 'Difficulty in Abstract Thinking', subscaleName: 'Negative Scale' },
      { itemNumber: 13, questionText: 'Lack of Spontaneity/Flow', subscaleName: 'Negative Scale' },
      { itemNumber: 14, questionText: 'Stereotyped Thinking', subscaleName: 'Negative Scale' },
      // General Psychopathology (G1–G16)
      { itemNumber: 15, questionText: 'Somatic Concern', subscaleName: 'General Psychopathology' },
      { itemNumber: 16, questionText: 'Anxiety', subscaleName: 'General Psychopathology' },
      { itemNumber: 17, questionText: 'Guilt Feelings', subscaleName: 'General Psychopathology' },
      { itemNumber: 18, questionText: 'Tension', subscaleName: 'General Psychopathology' },
      { itemNumber: 19, questionText: 'Mannerisms/Posturing', subscaleName: 'General Psychopathology' },
      { itemNumber: 20, questionText: 'Depression', subscaleName: 'General Psychopathology' },
      { itemNumber: 21, questionText: 'Motor Retardation', subscaleName: 'General Psychopathology' },
      { itemNumber: 22, questionText: 'Uncooperativeness', subscaleName: 'General Psychopathology' },
      { itemNumber: 23, questionText: 'Unusual Thought Content', subscaleName: 'General Psychopathology' },
      { itemNumber: 24, questionText: 'Disorientation', subscaleName: 'General Psychopathology' },
      { itemNumber: 25, questionText: 'Poor Attention', subscaleName: 'General Psychopathology' },
      { itemNumber: 26, questionText: 'Lack of Judgment and Insight', subscaleName: 'General Psychopathology' },
      { itemNumber: 27, questionText: 'Disturbance of Volition', subscaleName: 'General Psychopathology' },
      { itemNumber: 28, questionText: 'Poor Impulse Control', subscaleName: 'General Psychopathology' },
      { itemNumber: 29, questionText: 'Preoccupation', subscaleName: 'General Psychopathology' },
      { itemNumber: 30, questionText: 'Active Social Avoidance', subscaleName: 'General Psychopathology' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. OASIS (Overall Anxiety Severity and Impairment Scale)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'OASIS',
    fullName: 'Overall Anxiety Severity and Impairment Scale',
    instrumentType: 'anxiety' as const,
    description: 'A brief 5-item measure that can be used to assess severity and impairment associated with any anxiety disorder or multiple anxiety disorders.',
    instructions: 'The Overall Anxiety Severity and Impairment Scale (OASIS) is a 5-item self-report measure used to assess the frequency and severity of anxiety symptoms and their impact on functioning. Each item is rated on a 0\u20134 scale. Please answer each item based on the past week.',
    scaleMin: 0,
    scaleMax: 4,
    scaleLabels: { 0: 'No anxiety', 1: 'Mild', 2: 'Moderate', 3: 'Severe', 4: 'Extreme' },
    scoringMethod: 'sum',
    totalScoreRange: { min: 0, max: 20 },
    subscales: [],
    clinicalCutoffs: [
      { min: 0, max: 4, label: 'Minimal', severity: 'minimal' },
      { min: 5, max: 8, label: 'Mild', severity: 'mild' },
      { min: 9, max: 12, label: 'Moderate', severity: 'moderate' },
      { min: 13, max: 16, label: 'Severe', severity: 'severe' },
      { min: 17, max: 20, label: 'Extreme', severity: 'extreme' },
    ],
    items: [
      {
        itemNumber: 1,
        questionText: 'In the past week, how often have you felt anxious?',
        scaleLabels: { 0: 'No anxiety', 1: 'Infrequent anxiety', 2: 'Occasional anxiety', 3: 'Frequent anxiety', 4: 'Constant anxiety' },
        subscaleName: null,
      },
      {
        itemNumber: 2,
        questionText: 'In the past week, when you have felt anxious, how intense or severe was your anxiety?',
        scaleLabels: { 0: 'Little or no anxiety', 1: 'Mild anxiety', 2: 'Moderate anxiety', 3: 'Severe anxiety', 4: 'Extreme anxiety' },
        subscaleName: null,
      },
      {
        itemNumber: 3,
        questionText: 'In the past week, how often did you avoid situations, places, objects, or activities because of anxiety or fear?',
        scaleLabels: { 0: 'None / no avoidance', 1: 'Infrequent avoidance', 2: 'Occasional avoidance', 3: 'Frequent avoidance', 4: 'Constant avoidance (all the time)' },
        subscaleName: null,
      },
      {
        itemNumber: 4,
        questionText: 'In the past week, how much did your anxiety interfere with your ability to do the things you needed to do at work, at school, or at home?',
        scaleLabels: { 0: 'None / no interference', 1: 'Mild interference', 2: 'Moderate interference', 3: 'Severe interference', 4: 'Extreme interference' },
        subscaleName: null,
      },
      {
        itemNumber: 5,
        questionText: 'In the past week, how much has anxiety interfered with your social life and relationships?',
        scaleLabels: { 0: 'None / no interference', 1: 'Mild interference', 2: 'Moderate interference', 3: 'Severe interference', 4: 'Extreme interference' },
        subscaleName: null,
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. PCL-5 (PTSD Checklist for DSM-5)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'PCL-5',
    fullName: 'PTSD Checklist for DSM-5',
    instrumentType: 'ptsd' as const,
    description: 'A 20-item self-report measure that assesses the 20 DSM-5 symptoms of PTSD.',
    instructions: 'Below is a list of problems that people sometimes have in response to a very stressful experience. Please read each problem carefully and then select one of the numbers to indicate how much you have been bothered by that problem in the past month.',
    scaleMin: 0,
    scaleMax: 4,
    scaleLabels: { 0: 'Not at all', 1: 'A little bit', 2: 'Moderately', 3: 'Quite a bit', 4: 'Extremely' },
    scoringMethod: 'sum',
    totalScoreRange: { min: 0, max: 80 },
    subscales: [
      { name: 'Cluster B: Intrusion Symptoms', items: [1, 2, 3, 4, 5] },
      { name: 'Cluster C: Avoidance', items: [6, 7] },
      { name: 'Cluster D: Negative Cognitions and Mood', items: [8, 9, 10, 11, 12, 13, 14] },
      { name: 'Cluster E: Arousal and Reactivity', items: [15, 16, 17, 18, 19, 20] },
    ],
    clinicalCutoffs: [
      { min: 0, max: 30, label: 'Below threshold', severity: 'minimal' },
      { min: 31, max: 33, label: 'Probable PTSD (threshold)', severity: 'moderate' },
      { min: 34, max: 80, label: 'Probable PTSD', severity: 'severe' },
    ],
    items: [
      // Cluster B: Intrusion Symptoms (Items 1–5)
      { itemNumber: 1, questionText: 'Repeated, disturbing, and unwanted memories of the stressful experience?', subscaleName: 'Cluster B: Intrusion Symptoms' },
      { itemNumber: 2, questionText: 'Repeated, disturbing dreams of the stressful experience?', subscaleName: 'Cluster B: Intrusion Symptoms' },
      { itemNumber: 3, questionText: 'Suddenly feeling or acting as if the stressful experience were actually happening again?', subscaleName: 'Cluster B: Intrusion Symptoms' },
      { itemNumber: 4, questionText: 'Feeling very upset when something reminded you of the stressful experience?', subscaleName: 'Cluster B: Intrusion Symptoms' },
      { itemNumber: 5, questionText: 'Having strong physical reactions when something reminded you of the stressful experience?', subscaleName: 'Cluster B: Intrusion Symptoms' },
      // Cluster C: Avoidance (Items 6–7)
      { itemNumber: 6, questionText: 'Avoiding memories, thoughts, or feelings related to the stressful experience?', subscaleName: 'Cluster C: Avoidance' },
      { itemNumber: 7, questionText: 'Avoiding external reminders of the stressful experience?', subscaleName: 'Cluster C: Avoidance' },
      // Cluster D: Negative Cognitions and Mood (Items 8–14)
      { itemNumber: 8, questionText: 'Trouble remembering important parts of the stressful experience?', subscaleName: 'Cluster D: Negative Cognitions and Mood' },
      { itemNumber: 9, questionText: 'Having strong negative beliefs about yourself, other people, or the world?', subscaleName: 'Cluster D: Negative Cognitions and Mood' },
      { itemNumber: 10, questionText: 'Blaming yourself or someone else for the stressful experience or what happened after it?', subscaleName: 'Cluster D: Negative Cognitions and Mood' },
      { itemNumber: 11, questionText: 'Having strong negative feelings such as fear, horror, anger, guilt, or shame?', subscaleName: 'Cluster D: Negative Cognitions and Mood' },
      { itemNumber: 12, questionText: 'Loss of interest in activities that you used to enjoy?', subscaleName: 'Cluster D: Negative Cognitions and Mood' },
      { itemNumber: 13, questionText: 'Feeling distant or cut off from other people?', subscaleName: 'Cluster D: Negative Cognitions and Mood' },
      { itemNumber: 14, questionText: 'Trouble experiencing positive feelings?', subscaleName: 'Cluster D: Negative Cognitions and Mood' },
      // Cluster E: Arousal and Reactivity (Items 15–20)
      { itemNumber: 15, questionText: 'Irritable behavior, angry outbursts, or acting aggressively?', subscaleName: 'Cluster E: Arousal and Reactivity' },
      { itemNumber: 16, questionText: 'Taking too many risks or doing things that could cause you harm?', subscaleName: 'Cluster E: Arousal and Reactivity' },
      { itemNumber: 17, questionText: 'Being superalert or watchful or on guard?', subscaleName: 'Cluster E: Arousal and Reactivity' },
      { itemNumber: 18, questionText: 'Feeling jumpy or easily startled?', subscaleName: 'Cluster E: Arousal and Reactivity' },
      { itemNumber: 19, questionText: 'Having difficulty concentrating?', subscaleName: 'Cluster E: Arousal and Reactivity' },
      { itemNumber: 20, questionText: 'Trouble falling or staying asleep?', subscaleName: 'Cluster E: Arousal and Reactivity' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. BAM (Brief Addiction Monitor)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'BAM',
    fullName: 'Brief Addiction Monitor',
    instrumentType: 'substance_use' as const,
    description: 'A 17-item substance use disorder screening and monitoring instrument for tracking treatment progress across substance use, risk factors, protective factors, and treatment engagement.',
    instructions: 'Please answer the following questions about your experiences. Rate each item on the scale provided.',
    scaleMin: 0,
    scaleMax: 4,
    scaleLabels: { 0: 'Never', 1: 'Rarely', 2: 'Sometimes', 3: 'Often', 4: 'Almost Always' },
    scoringMethod: 'sum',
    totalScoreRange: { min: 0, max: 68 },
    subscales: [
      { name: 'Substance Use', items: [1, 2, 3, 4, 5] },
      { name: 'Risk Factors', items: [6, 7, 8] },
      { name: 'Protective Factors', items: [9, 10, 11, 12] },
      { name: 'Treatment Engagement', items: [13, 14, 15, 16, 17] },
    ],
    clinicalCutoffs: [],
    items: [
      // Substance Use (Items 1–5)
      { itemNumber: 1, questionText: 'Used any alcohol?', subscaleName: 'Substance Use' },
      { itemNumber: 2, questionText: 'Used any illegal/street drugs?', subscaleName: 'Substance Use' },
      { itemNumber: 3, questionText: 'Used prescription medications for non-medical reasons?', subscaleName: 'Substance Use' },
      { itemNumber: 4, questionText: 'Used tobacco/nicotine products?', subscaleName: 'Substance Use' },
      { itemNumber: 5, questionText: 'Had a strong urge or craving to use substances?', subscaleName: 'Substance Use' },
      // Risk Factors (Items 6–8)
      { itemNumber: 6, questionText: 'Been around people who were using alcohol or drugs?', subscaleName: 'Risk Factors' },
      { itemNumber: 7, questionText: 'Experienced stress or emotional problems?', subscaleName: 'Risk Factors' },
      { itemNumber: 8, questionText: 'Felt unable to cope without using substances?', subscaleName: 'Risk Factors' },
      // Protective Factors (Items 9–12)
      { itemNumber: 9, questionText: 'Attended self-help meetings (AA, NA)?', subscaleName: 'Protective Factors' },
      { itemNumber: 10, questionText: 'Had contact with a sponsor or recovery support person?', subscaleName: 'Protective Factors' },
      { itemNumber: 11, questionText: 'Spent time with family or friends who support your recovery?', subscaleName: 'Protective Factors' },
      { itemNumber: 12, questionText: 'Engaged in physical activity or exercise?', subscaleName: 'Protective Factors' },
      // Treatment Engagement (Items 13–17)
      { itemNumber: 13, questionText: 'Taken prescribed medications as directed?', subscaleName: 'Treatment Engagement' },
      { itemNumber: 14, questionText: 'Kept scheduled appointments with treatment providers?', subscaleName: 'Treatment Engagement' },
      { itemNumber: 15, questionText: 'How confident are you in your ability to remain abstinent?', subscaleName: 'Treatment Engagement' },
      { itemNumber: 16, questionText: 'How satisfied are you with your progress in treatment?', subscaleName: 'Treatment Engagement' },
      { itemNumber: 17, questionText: 'How would you rate your quality of life?', subscaleName: 'Treatment Engagement' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. HAM-D (Hamilton Depression Rating Scale)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'HAM-D',
    fullName: 'Hamilton Depression Rating Scale (17-item)',
    instrumentType: 'depression' as const,
    description: 'A 17-item clinician-administered depression assessment scale. The first widely used rating scale for depression.',
    instructions: 'For each item, select the response that best characterizes the patient during the past week. Items have varying scale ranges \u2014 some 0\u20134, others 0\u20132.',
    scaleMin: 0,
    scaleMax: 4,
    scaleLabels: { 0: 'Absent', 1: 'Mild', 2: 'Moderate', 3: 'Severe', 4: 'Very Severe' },
    scoringMethod: 'sum',
    totalScoreRange: { min: 0, max: 52 },
    subscales: [],
    clinicalCutoffs: [
      { min: 0, max: 7, label: 'Normal', severity: 'normal' },
      { min: 8, max: 13, label: 'Mild Depression', severity: 'mild' },
      { min: 14, max: 18, label: 'Moderate Depression', severity: 'moderate' },
      { min: 19, max: 22, label: 'Severe Depression', severity: 'severe' },
      { min: 23, max: 52, label: 'Very Severe Depression', severity: 'very_severe' },
    ],
    items: [
      { itemNumber: 1, questionText: 'Depressed Mood', scaleMin: 0, scaleMax: 4, scaleLabels: { 0: 'Absent', 1: 'Sadness', 2: 'Occasional weeping', 3: 'Frequent weeping', 4: 'Extreme' }, subscaleName: null },
      { itemNumber: 2, questionText: 'Feelings of Guilt', scaleMin: 0, scaleMax: 4, scaleLabels: { 0: 'Absent', 1: 'Self-reproach', 2: 'Ideas of guilt', 3: 'Delusions of guilt', 4: 'Hallucinations' }, subscaleName: null },
      { itemNumber: 3, questionText: 'Suicide', scaleMin: 0, scaleMax: 4, scaleLabels: { 0: 'Absent', 1: 'Feels life not worth living', 2: 'Wishes were dead', 3: 'Suicidal ideas', 4: 'Attempts' }, subscaleName: null },
      { itemNumber: 4, questionText: 'Insomnia Early', scaleMin: 0, scaleMax: 2, scaleLabels: { 0: 'No difficulty', 1: 'Occasional', 2: 'Nightly' }, subscaleName: null },
      { itemNumber: 5, questionText: 'Insomnia Middle', scaleMin: 0, scaleMax: 2, scaleLabels: { 0: 'No difficulty', 1: 'Restless', 2: 'Waking during night' }, subscaleName: null },
      { itemNumber: 6, questionText: 'Insomnia Late', scaleMin: 0, scaleMax: 2, scaleLabels: { 0: 'No difficulty', 1: 'Waking early', 2: 'Unable to sleep again' }, subscaleName: null },
      { itemNumber: 7, questionText: 'Work and Activities', scaleMin: 0, scaleMax: 4, scaleLabels: { 0: 'No difficulty', 1: 'Incapacity thoughts', 2: 'Loss of interest', 3: 'Decreased productivity', 4: 'Stopped working' }, subscaleName: null },
      { itemNumber: 8, questionText: 'Retardation', scaleMin: 0, scaleMax: 4, scaleLabels: { 0: 'Normal', 1: 'Slight', 2: 'Obvious', 3: 'Interview difficult', 4: 'Complete stupor' }, subscaleName: null },
      { itemNumber: 9, questionText: 'Agitation', scaleMin: 0, scaleMax: 4, scaleLabels: { 0: 'None', 1: 'Fidgetiness', 2: 'Playing with hands', 3: 'Moving about', 4: 'Hand wringing' }, subscaleName: null },
      { itemNumber: 10, questionText: 'Anxiety Psychic', scaleMin: 0, scaleMax: 4, scaleLabels: { 0: 'No difficulty', 1: 'Subjective tension', 2: 'Worrying about minor matters', 3: 'Apprehensive attitude', 4: 'Fears expressed' }, subscaleName: null },
      { itemNumber: 11, questionText: 'Anxiety Somatic', scaleMin: 0, scaleMax: 4, scaleLabels: { 0: 'Absent', 1: 'Mild', 2: 'Moderate', 3: 'Severe', 4: 'Incapacitating' }, subscaleName: null },
      { itemNumber: 12, questionText: 'Somatic Symptoms GI', scaleMin: 0, scaleMax: 2, scaleLabels: { 0: 'None', 1: 'Loss of appetite', 2: 'Difficulty eating without urging' }, subscaleName: null },
      { itemNumber: 13, questionText: 'Somatic Symptoms General', scaleMin: 0, scaleMax: 2, scaleLabels: { 0: 'None', 1: 'Heaviness in limbs', 2: 'Any clear-cut symptom' }, subscaleName: null },
      { itemNumber: 14, questionText: 'Genital Symptoms', scaleMin: 0, scaleMax: 2, scaleLabels: { 0: 'Absent', 1: 'Mild', 2: 'Severe' }, subscaleName: null },
      { itemNumber: 15, questionText: 'Hypochondriasis', scaleMin: 0, scaleMax: 4, scaleLabels: { 0: 'Not present', 1: 'Self-absorption', 2: 'Preoccupation with health', 3: 'Frequent complaints', 4: 'Hypochondriacal delusions' }, subscaleName: null },
      { itemNumber: 16, questionText: 'Loss of Weight', scaleMin: 0, scaleMax: 2, scaleLabels: { 0: 'No weight loss', 1: 'Probable weight loss', 2: 'Definite weight loss' }, subscaleName: null },
      { itemNumber: 17, questionText: 'Insight', scaleMin: 0, scaleMax: 2, scaleLabels: { 0: 'Acknowledges being ill', 1: 'Acknowledges but attributes to diet', 2: 'Denies being ill' }, subscaleName: null },
    ],
  },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================

async function seed() {
  console.log('Seeding assessment instruments...\n');

  for (const instrumentData of instruments) {
    const { items, ...instrumentFields } = instrumentData;

    // Check if instrument already exists by name
    const existing = await db
      .select()
      .from(assessmentInstrumentsSchema)
      .where(eq(assessmentInstrumentsSchema.name, instrumentFields.name))
      .limit(1);

    let instrumentId: string;

    if (existing.length > 0) {
      // Update existing instrument
      const [updated] = await db
        .update(assessmentInstrumentsSchema)
        .set({
          ...instrumentFields,
          itemCount: items.length,
          updatedAt: new Date(),
        })
        .where(eq(assessmentInstrumentsSchema.id, existing[0].id))
        .returning();

      instrumentId = updated.id;
      console.log(`  Updated: ${instrumentFields.name} (${instrumentFields.fullName})`);

      // Delete existing responses referencing old items, then delete items to re-seed
      const oldItems = await db
        .select({ id: assessmentInstrumentItemsSchema.id })
        .from(assessmentInstrumentItemsSchema)
        .where(eq(assessmentInstrumentItemsSchema.instrumentId, instrumentId));

      if (oldItems.length > 0) {
        const oldItemIds = oldItems.map(i => i.id);
        await db
          .delete(assessmentResponsesSchema)
          .where(inArray(assessmentResponsesSchema.itemId, oldItemIds));
      }

      await db
        .delete(assessmentInstrumentItemsSchema)
        .where(eq(assessmentInstrumentItemsSchema.instrumentId, instrumentId));
    } else {
      // Insert new instrument
      const [inserted] = await db
        .insert(assessmentInstrumentsSchema)
        .values({
          ...instrumentFields,
          itemCount: items.length,
        })
        .returning();

      instrumentId = inserted.id;
      console.log(`  Created: ${instrumentFields.name} (${instrumentFields.fullName})`);
    }

    // Insert items
    await db.insert(assessmentInstrumentItemsSchema).values(
      items.map(item => ({
        instrumentId,
        itemNumber: item.itemNumber,
        questionText: item.questionText,
        itemType: 'likert' as const,
        scaleMin: (item as any).scaleMin ?? null,
        scaleMax: (item as any).scaleMax ?? null,
        scaleLabels: (item as any).scaleLabels ?? null,
        isReverseScored: false,
        subscaleName: item.subscaleName ?? null,
        isRequired: true,
      })),
    );

    console.log(`    -> Seeded ${items.length} items\n`);
  }

  console.log('Assessment instruments seeded successfully!');
}

seed()
  .catch((error) => {
    console.error('Error seeding assessment instruments:', error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
