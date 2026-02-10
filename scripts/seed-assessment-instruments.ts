/**
 * Seed Clinical Assessment Instruments
 * Populates PCL-5, HAM-D, PANSS, BAM, and OASIS with actual questions
 */

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  assessmentInstrumentItemsSchema,
  assessmentInstrumentsSchema,
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
  // 1. PCL-5 (PTSD Checklist for DSM-5)
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
      { name: 'Cluster B - Intrusion', items: [1, 2, 3, 4, 5] },
      { name: 'Cluster C - Avoidance', items: [6, 7] },
      { name: 'Cluster D - Negative Cognitions', items: [8, 9, 10, 11, 12, 13, 14] },
      { name: 'Cluster E - Arousal', items: [15, 16, 17, 18, 19, 20] },
    ],
    clinicalCutoffs: [
      { min: 0, max: 30, label: 'Below threshold', severity: 'minimal' },
      { min: 31, max: 33, label: 'Probable PTSD (threshold)', severity: 'moderate' },
      { min: 34, max: 80, label: 'Probable PTSD', severity: 'severe' },
    ],
    items: [
      { itemNumber: 1, questionText: 'Repeated, disturbing, and unwanted memories of the stressful experience?', subscaleName: 'Cluster B - Intrusion' },
      { itemNumber: 2, questionText: 'Repeated, disturbing dreams of the stressful experience?', subscaleName: 'Cluster B - Intrusion' },
      { itemNumber: 3, questionText: 'Suddenly feeling or acting as if the stressful experience were actually happening again (as if you were actually back there reliving it)?', subscaleName: 'Cluster B - Intrusion' },
      { itemNumber: 4, questionText: 'Feeling very upset when something reminded you of the stressful experience?', subscaleName: 'Cluster B - Intrusion' },
      { itemNumber: 5, questionText: 'Having strong physical reactions when something reminded you of the stressful experience (for example, heart pounding, trouble breathing, sweating)?', subscaleName: 'Cluster B - Intrusion' },
      { itemNumber: 6, questionText: 'Avoiding memories, thoughts, or feelings related to the stressful experience?', subscaleName: 'Cluster C - Avoidance' },
      { itemNumber: 7, questionText: 'Avoiding external reminders of the stressful experience (for example, people, places, conversations, activities, objects, or situations)?', subscaleName: 'Cluster C - Avoidance' },
      { itemNumber: 8, questionText: 'Trouble remembering important parts of the stressful experience?', subscaleName: 'Cluster D - Negative Cognitions' },
      { itemNumber: 9, questionText: 'Having strong negative beliefs about yourself, other people, or the world (for example, having thoughts such as: I am bad, there is something seriously wrong with me, no one can be trusted, the world is completely dangerous)?', subscaleName: 'Cluster D - Negative Cognitions' },
      { itemNumber: 10, questionText: 'Blaming yourself or someone else for the stressful experience or what happened after it?', subscaleName: 'Cluster D - Negative Cognitions' },
      { itemNumber: 11, questionText: 'Having strong negative feelings such as fear, horror, anger, guilt, or shame?', subscaleName: 'Cluster D - Negative Cognitions' },
      { itemNumber: 12, questionText: 'Loss of interest in activities that you used to enjoy?', subscaleName: 'Cluster D - Negative Cognitions' },
      { itemNumber: 13, questionText: 'Feeling distant or cut off from other people?', subscaleName: 'Cluster D - Negative Cognitions' },
      { itemNumber: 14, questionText: 'Trouble experiencing positive feelings (for example, being unable to feel happiness or have loving feelings for people close to you)?', subscaleName: 'Cluster D - Negative Cognitions' },
      { itemNumber: 15, questionText: 'Irritable behavior, angry outbursts, or acting aggressively?', subscaleName: 'Cluster E - Arousal' },
      { itemNumber: 16, questionText: 'Taking too many risks or doing things that could cause you harm?', subscaleName: 'Cluster E - Arousal' },
      { itemNumber: 17, questionText: 'Being "superalert" or watchful or on guard?', subscaleName: 'Cluster E - Arousal' },
      { itemNumber: 18, questionText: 'Feeling jumpy or easily startled?', subscaleName: 'Cluster E - Arousal' },
      { itemNumber: 19, questionText: 'Having difficulty concentrating?', subscaleName: 'Cluster E - Arousal' },
      { itemNumber: 20, questionText: 'Trouble falling or staying asleep?', subscaleName: 'Cluster E - Arousal' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. HAM-D (Hamilton Depression Rating Scale)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'HAM-D',
    fullName: 'Hamilton Depression Rating Scale (17-item)',
    instrumentType: 'depression' as const,
    description: 'A clinician-administered depression assessment scale with 17 items. The first widely used rating scale for depression.',
    instructions: 'For each item, select the response that best characterizes the patient during the past week. Items have varying scale ranges — some 0-4, others 0-2.',
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
      { itemNumber: 1, questionText: 'Depressed Mood (sadness, hopeless, helpless, worthless)', scaleMin: 0, scaleMax: 4, scaleLabels: { 0: 'Absent', 1: 'Indicated only on questioning', 2: 'Spontaneously reported verbally', 3: 'Non-verbal communication (facial expression, posture, voice, tendency to weep)', 4: 'Patient reports virtually only these feeling states' }, subscaleName: null },
      { itemNumber: 2, questionText: 'Feelings of Guilt', scaleMin: 0, scaleMax: 4, scaleLabels: { 0: 'Absent', 1: 'Self-reproach, feels they have let people down', 2: 'Ideas of guilt or rumination over past errors or sinful deeds', 3: 'Present illness is a punishment; delusions of guilt', 4: 'Hears accusatory or denunciatory voices; experiences threatening visual hallucinations' }, subscaleName: null },
      { itemNumber: 3, questionText: 'Suicide', scaleMin: 0, scaleMax: 4, scaleLabels: { 0: 'Absent', 1: 'Feels life is not worth living', 2: 'Wishes they were dead or thoughts of their own death', 3: 'Suicidal ideas or gestures', 4: 'Attempts at suicide' }, subscaleName: null },
      { itemNumber: 4, questionText: 'Insomnia — Early (initial insomnia)', scaleMin: 0, scaleMax: 2, scaleLabels: { 0: 'No difficulty falling asleep', 1: 'Occasional difficulty falling asleep (more than half an hour)', 2: 'Nightly difficulty falling asleep' }, subscaleName: null },
      { itemNumber: 5, questionText: 'Insomnia — Middle', scaleMin: 0, scaleMax: 2, scaleLabels: { 0: 'No difficulty', 1: 'Restless and disturbed during the night', 2: 'Waking during the night — getting out of bed (except to void)' }, subscaleName: null },
      { itemNumber: 6, questionText: 'Insomnia — Late (terminal insomnia)', scaleMin: 0, scaleMax: 2, scaleLabels: { 0: 'No difficulty', 1: 'Waking in early hours of morning but goes back to sleep', 2: 'Unable to fall asleep again if gets out of bed' }, subscaleName: null },
      { itemNumber: 7, questionText: 'Work and Activities', scaleMin: 0, scaleMax: 4, scaleLabels: { 0: 'No difficulty', 1: 'Thoughts and feelings of incapacity, fatigue or weakness related to activities, work or hobbies', 2: 'Loss of interest in activities, hobbies or work — reported directly by patient or indirectly in listlessness', 3: 'Decrease in actual time spent in activities or decrease in productivity', 4: 'Stopped working because of present illness' }, subscaleName: null },
      { itemNumber: 8, questionText: 'Retardation (slowness of thought and speech, impaired ability to concentrate, decreased motor activity)', scaleMin: 0, scaleMax: 4, scaleLabels: { 0: 'Normal speech and thought', 1: 'Slight retardation at interview', 2: 'Obvious retardation at interview', 3: 'Interview difficult', 4: 'Complete stupor' }, subscaleName: null },
      { itemNumber: 9, questionText: 'Agitation', scaleMin: 0, scaleMax: 2, scaleLabels: { 0: 'None', 1: 'Fidgetiness', 2: 'Playing with hands, hair, etc. Obvious restlessness' }, subscaleName: null },
      { itemNumber: 10, questionText: 'Anxiety — Psychic', scaleMin: 0, scaleMax: 4, scaleLabels: { 0: 'No difficulty', 1: 'Subjective tension and irritability', 2: 'Worrying about minor matters', 3: 'Apprehensive attitude apparent in face or speech', 4: 'Fears expressed without questioning' }, subscaleName: null },
      { itemNumber: 11, questionText: 'Anxiety — Somatic (physiological concomitants of anxiety such as GI, CV, respiratory, urinary, sweating)', scaleMin: 0, scaleMax: 4, scaleLabels: { 0: 'Absent', 1: 'Mild', 2: 'Moderate', 3: 'Severe', 4: 'Incapacitating' }, subscaleName: null },
      { itemNumber: 12, questionText: 'Somatic Symptoms — Gastrointestinal', scaleMin: 0, scaleMax: 2, scaleLabels: { 0: 'None', 1: 'Loss of appetite but eating without encouragement; heavy feeling in abdomen', 2: 'Difficulty eating without urging; requests or requires laxatives or medication for bowels or GI symptoms' }, subscaleName: null },
      { itemNumber: 13, questionText: 'Somatic Symptoms — General', scaleMin: 0, scaleMax: 2, scaleLabels: { 0: 'None', 1: 'Heaviness in limbs, back or head; backaches, headache, muscle aches; loss of energy and fatigability', 2: 'Any clear-cut symptom rates 2' }, subscaleName: null },
      { itemNumber: 14, questionText: 'Genital Symptoms (loss of libido, menstrual disturbances)', scaleMin: 0, scaleMax: 2, scaleLabels: { 0: 'Absent', 1: 'Mild', 2: 'Severe' }, subscaleName: null },
      { itemNumber: 15, questionText: 'Hypochondriasis', scaleMin: 0, scaleMax: 4, scaleLabels: { 0: 'Not present', 1: 'Self-absorption (bodily)', 2: 'Preoccupation with health', 3: 'Frequent complaints, requests for help', 4: 'Hypochondriacal delusions' }, subscaleName: null },
      { itemNumber: 16, questionText: 'Loss of Weight (rate A or B)', scaleMin: 0, scaleMax: 2, scaleLabels: { 0: 'No weight loss', 1: 'Probable weight loss associated with present illness', 2: 'Definite (according to patient) weight loss' }, subscaleName: null },
      { itemNumber: 17, questionText: 'Insight', scaleMin: 0, scaleMax: 2, scaleLabels: { 0: 'Acknowledges being depressed and ill', 1: 'Acknowledges illness but attributes cause to bad food, climate, overwork, virus, need for rest, etc.', 2: 'Denies being ill at all' }, subscaleName: null },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. PANSS (Positive and Negative Syndrome Scale)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'PANSS',
    fullName: 'Positive and Negative Syndrome Scale',
    instrumentType: 'schizophrenia' as const,
    description: 'A 30-item clinician-rated instrument for measuring severity of psychopathology in adults with schizophrenia.',
    instructions: 'Rate each item based on the clinical interview and available collateral information. Each item is rated on a 7-point scale from 1 (Absent) to 7 (Extreme).',
    scaleMin: 1,
    scaleMax: 7,
    scaleLabels: { 1: 'Absent', 2: 'Minimal', 3: 'Mild', 4: 'Moderate', 5: 'Moderate Severe', 6: 'Severe', 7: 'Extreme' },
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
      // Positive Scale (P1-P7)
      { itemNumber: 1, questionText: 'P1 — Delusions: Beliefs which are unfounded, unrealistic, and idiosyncratic', subscaleName: 'Positive Scale' },
      { itemNumber: 2, questionText: 'P2 — Conceptual Disorganization: Disorganized process of thinking characterized by disruption of goal-directed sequencing', subscaleName: 'Positive Scale' },
      { itemNumber: 3, questionText: 'P3 — Hallucinatory Behavior: Verbal report or behavior indicating perceptions which are not generated by external stimuli', subscaleName: 'Positive Scale' },
      { itemNumber: 4, questionText: 'P4 — Excitement: Hyperactivity as reflected in accelerated motor behavior, heightened responsivity to stimuli, hypervigilance, or excessive mood lability', subscaleName: 'Positive Scale' },
      { itemNumber: 5, questionText: 'P5 — Grandiosity: Exaggerated self-opinion and unrealistic convictions of superiority', subscaleName: 'Positive Scale' },
      { itemNumber: 6, questionText: 'P6 — Suspiciousness/Persecution: Unrealistic or exaggerated ideas of persecution, as reflected in guardedness, a distrustful attitude, suspicious hypervigilance, or frank delusions', subscaleName: 'Positive Scale' },
      { itemNumber: 7, questionText: 'P7 — Hostility: Verbal and nonverbal expressions of anger and resentment', subscaleName: 'Positive Scale' },
      // Negative Scale (N1-N7)
      { itemNumber: 8, questionText: 'N1 — Blunted Affect: Diminished emotional responsiveness as characterized by a reduction in facial expression, modulation of feelings, and communicative gestures', subscaleName: 'Negative Scale' },
      { itemNumber: 9, questionText: 'N2 — Emotional Withdrawal: Lack of interest in, involvement with, and affective commitment to life events', subscaleName: 'Negative Scale' },
      { itemNumber: 10, questionText: 'N3 — Poor Rapport: Lack of interpersonal empathy, openness in conversation, and sense of closeness, interest, or involvement with the interviewer', subscaleName: 'Negative Scale' },
      { itemNumber: 11, questionText: 'N4 — Passive/Apathetic Social Withdrawal: Diminished interest and initiative in social interactions due to passivity, apathy, anergy, or avolition', subscaleName: 'Negative Scale' },
      { itemNumber: 12, questionText: 'N5 — Difficulty in Abstract Thinking: Impairment in the use of the abstract-symbolic mode of thinking', subscaleName: 'Negative Scale' },
      { itemNumber: 13, questionText: 'N6 — Lack of Spontaneity and Flow of Conversation: Reduction in the normal flow of communication associated with apathy, avolition, defensiveness, or cognitive deficit', subscaleName: 'Negative Scale' },
      { itemNumber: 14, questionText: 'N7 — Stereotyped Thinking: Decreased fluidity, spontaneity, and flexibility of thinking, as evidenced in rigid, repetitious, or barren thought content', subscaleName: 'Negative Scale' },
      // General Psychopathology (G1-G16)
      { itemNumber: 15, questionText: 'G1 — Somatic Concern: Physical complaints or beliefs about bodily illness or malfunction', subscaleName: 'General Psychopathology' },
      { itemNumber: 16, questionText: 'G2 — Anxiety: Subjective experience of nervousness, worry, apprehension, or restlessness', subscaleName: 'General Psychopathology' },
      { itemNumber: 17, questionText: 'G3 — Guilt Feelings: Sense of remorse or self-blame for real or imagined misdeeds in the past', subscaleName: 'General Psychopathology' },
      { itemNumber: 18, questionText: 'G4 — Tension: Overt physical manifestations of fear, anxiety, and agitation', subscaleName: 'General Psychopathology' },
      { itemNumber: 19, questionText: 'G5 — Mannerisms and Posturing: Unnatural movements or posture as characterized by an awkward, stilted, disorganized, or bizarre appearance', subscaleName: 'General Psychopathology' },
      { itemNumber: 20, questionText: 'G6 — Depression: Feelings of sadness, discouragement, helplessness, and pessimism', subscaleName: 'General Psychopathology' },
      { itemNumber: 21, questionText: 'G7 — Motor Retardation: Reduction in motor activity as reflected in slowing or lessening of movements and speech, diminished responsiveness to stimuli, and reduced body tone', subscaleName: 'General Psychopathology' },
      { itemNumber: 22, questionText: 'G8 — Uncooperativeness: Active refusal to comply with the will of significant others', subscaleName: 'General Psychopathology' },
      { itemNumber: 23, questionText: 'G9 — Unusual Thought Content: Thinking characterized by strange, fantastic, or bizarre ideas', subscaleName: 'General Psychopathology' },
      { itemNumber: 24, questionText: 'G10 — Disorientation: Lack of awareness of one\'s relationship to the milieu', subscaleName: 'General Psychopathology' },
      { itemNumber: 25, questionText: 'G11 — Poor Attention: Failure in focused alertness manifested by poor concentration', subscaleName: 'General Psychopathology' },
      { itemNumber: 26, questionText: 'G12 — Lack of Judgment and Insight: Impaired awareness or understanding of one\'s own psychiatric condition and life situation', subscaleName: 'General Psychopathology' },
      { itemNumber: 27, questionText: 'G13 — Disturbance of Volition: Disturbance in the willful initiation, sustenance, and control of one\'s thoughts, behavior, movements, and speech', subscaleName: 'General Psychopathology' },
      { itemNumber: 28, questionText: 'G14 — Poor Impulse Control: Disordered regulation and control of action on inner urges', subscaleName: 'General Psychopathology' },
      { itemNumber: 29, questionText: 'G15 — Preoccupation: Absorption with internally generated thoughts and feelings and with autistic experiences to the detriment of reality orientation', subscaleName: 'General Psychopathology' },
      { itemNumber: 30, questionText: 'G16 — Active Social Avoidance: Diminished social involvement associated with unwarranted fear, hostility, or distrust', subscaleName: 'General Psychopathology' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. BAM (Brief Addiction Monitor)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'BAM',
    fullName: 'Brief Addiction Monitor',
    instrumentType: 'substance_use' as const,
    description: 'A 17-item clinician-administered instrument for monitoring substance use disorder treatment progress across risk and protective factors.',
    instructions: 'Please answer the following questions about your experiences in the past 30 days. Rate each item on the scale provided.',
    scaleMin: 0,
    scaleMax: 4,
    scaleLabels: { 0: 'Not at all', 1: 'Slightly', 2: 'Moderately', 3: 'Considerably', 4: 'Extremely' },
    scoringMethod: 'sum',
    totalScoreRange: { min: 0, max: 68 },
    subscales: [
      { name: 'Risk Factors', items: [1, 2, 3, 4, 5, 6, 7, 8] },
      { name: 'Protective Factors', items: [9, 10, 11, 12, 13, 14, 15, 16, 17] },
    ],
    clinicalCutoffs: [
      { min: 0, max: 17, label: 'Low Risk', severity: 'low' },
      { min: 18, max: 34, label: 'Moderate Risk', severity: 'moderate' },
      { min: 35, max: 68, label: 'High Risk', severity: 'high' },
    ],
    items: [
      // Risk Factors
      { itemNumber: 1, questionText: 'In the past 30 days, how much have you used alcohol or other drugs?', subscaleName: 'Risk Factors' },
      { itemNumber: 2, questionText: 'In the past 30 days, how much have you had urges or cravings to use alcohol or other drugs?', subscaleName: 'Risk Factors' },
      { itemNumber: 3, questionText: 'In the past 30 days, how much have you been around people or places that make you want to use alcohol or drugs?', subscaleName: 'Risk Factors' },
      { itemNumber: 4, questionText: 'In the past 30 days, how much stress have you been experiencing?', subscaleName: 'Risk Factors' },
      { itemNumber: 5, questionText: 'In the past 30 days, how much have you felt like giving up or not caring about your recovery?', subscaleName: 'Risk Factors' },
      { itemNumber: 6, questionText: 'In the past 30 days, how many days did you have pain or physical discomfort?', subscaleName: 'Risk Factors' },
      { itemNumber: 7, questionText: 'In the past 30 days, how much has your alcohol or drug use caused problems with your health, work, family, or legal situation?', subscaleName: 'Risk Factors' },
      { itemNumber: 8, questionText: 'In the past 30 days, how much have you been bothered by emotional problems (such as anxiety, depression, irritability)?', subscaleName: 'Risk Factors' },
      // Protective Factors
      { itemNumber: 9, questionText: 'In the past 30 days, how much have you been able to handle things when they go wrong?', subscaleName: 'Protective Factors' },
      { itemNumber: 10, questionText: 'In the past 30 days, how much has your religion or spirituality helped support your recovery?', subscaleName: 'Protective Factors' },
      { itemNumber: 11, questionText: 'In the past 30 days, how much have you been actively engaged in your recovery (e.g., attending meetings, counseling)?', subscaleName: 'Protective Factors' },
      { itemNumber: 12, questionText: 'In the past 30 days, how much have you been taking your prescribed medications as directed?', subscaleName: 'Protective Factors' },
      { itemNumber: 13, questionText: 'In the past 30 days, how much have you had positive social support from family or friends?', subscaleName: 'Protective Factors' },
      { itemNumber: 14, questionText: 'In the past 30 days, how much have you been able to meet your basic needs (food, housing, income)?', subscaleName: 'Protective Factors' },
      { itemNumber: 15, questionText: 'In the past 30 days, how confident are you in your ability to stay clean and sober?', subscaleName: 'Protective Factors' },
      { itemNumber: 16, questionText: 'In the past 30 days, how satisfied are you with your progress in treatment?', subscaleName: 'Protective Factors' },
      { itemNumber: 17, questionText: 'In the past 30 days, how meaningful or fulfilling has your life felt?', subscaleName: 'Protective Factors' },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. OASIS (Overall Anxiety Severity and Impairment Scale)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'OASIS',
    fullName: 'Overall Anxiety Severity and Impairment Scale',
    instrumentType: 'anxiety' as const,
    description: 'A brief 5-item measure that can be used to assess severity and impairment associated with any anxiety disorder or multiple anxiety disorders.',
    instructions: 'The following items ask about anxiety and fear. For each item, select the answer that best describes your experience over the past week.',
    scaleMin: 0,
    scaleMax: 4,
    scaleLabels: { 0: 'None / No anxiety', 1: 'Infrequent / Mild', 2: 'Occasional / Moderate', 3: 'Frequent / Severe', 4: 'Constant / Extreme' },
    scoringMethod: 'sum',
    totalScoreRange: { min: 0, max: 20 },
    subscales: [],
    clinicalCutoffs: [
      { min: 0, max: 7, label: 'Below clinical threshold', severity: 'minimal' },
      { min: 8, max: 20, label: 'Clinically significant anxiety', severity: 'clinical' },
    ],
    items: [
      {
        itemNumber: 1,
        questionText: 'In the past week, how often have you felt anxious?',
        scaleLabels: { 0: 'No anxiety in the past week', 1: 'Infrequent anxiety (once or twice)', 2: 'Occasional anxiety (a few times)', 3: 'Frequent anxiety (daily)', 4: 'Constant anxiety (most of the time)' },
        subscaleName: null,
      },
      {
        itemNumber: 2,
        questionText: 'In the past week, when you have felt anxious, how intense or severe was your anxiety?',
        scaleLabels: { 0: 'Little or none: anxiety was absent or barely noticeable', 1: 'Mild: anxiety was at a low level', 2: 'Moderate: anxiety was uncomfortable but manageable', 3: 'Severe: anxiety was very intense', 4: 'Extreme: anxiety was overwhelming' },
        subscaleName: null,
      },
      {
        itemNumber: 3,
        questionText: 'In the past week, how often did you avoid situations, places, objects, or activities because of anxiety or fear?',
        scaleLabels: { 0: 'None: I did not avoid anything', 1: 'Infrequent: avoided 1-2 times', 2: 'Occasional: avoided a few times', 3: 'Frequent: avoided many things', 4: 'Constant: avoided all activities that might make me anxious' },
        subscaleName: null,
      },
      {
        itemNumber: 4,
        questionText: 'In the past week, how much did your anxiety interfere with your ability to do the things you needed to do at work, at school, or at home?',
        scaleLabels: { 0: 'None: no interference', 1: 'Mild: slight interference, but I could manage', 2: 'Moderate: significant interference, functioning was impaired', 3: 'Severe: substantial interference', 4: 'Extreme: completely unable to function' },
        subscaleName: null,
      },
      {
        itemNumber: 5,
        questionText: 'In the past week, how much has anxiety interfered with your social life and relationships?',
        scaleLabels: { 0: 'None: no interference', 1: 'Mild: slight interference', 2: 'Moderate: some interference with social activities', 3: 'Severe: substantial interference with social life', 4: 'Extreme: completely unable to engage in social activities' },
        subscaleName: null,
      },
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

      // Delete existing items to re-seed
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
