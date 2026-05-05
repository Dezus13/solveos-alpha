"use client";

import { memo, useMemo } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, MessageSquareText } from 'lucide-react';
import type { DecisionBlueprint } from '@/lib/types';
import OutcomeLogger from '@/components/OutcomeLogger';

interface SimulationResultsProps {
  result: DecisionBlueprint;
  submittedProblem: string;
  initialShowBoard: boolean;
  t: Record<string, string>;
  memoryScore?: number;
  networkScore?: number;
  calibratedScore?: number;
  calibrationOffset?: number;
  calibrationSampleSize?: number;
  decisionId?: string;
  decisionAccuracy?: number;
  calibrationScore?: number;
}

type Labels = {
  title: string;
  subtitle: string;
  main: string;
  why: string;
  fail: string;
  next: string;
  change: string;
  evidence: string;
  today: string;
  thisWeek: string;
  thirtyDays: string;
  fallback: string;
  outcome: string;
};

const labelsByLanguage: Record<string, Labels> = {
  English: {
    title: 'Deep analysis',
    subtitle: 'A reasoning memo, not a metrics dashboard.',
    main: 'Main conclusion',
    why: 'Why',
    fail: 'What could go wrong',
    next: 'Next step',
    change: 'What would change this answer',
    evidence: 'Evidence to watch',
    today: 'Today',
    thisWeek: 'This week',
    thirtyDays: '30 days',
    fallback: 'Not enough signal yet.',
    outcome: 'Outcome logging',
  },
  German: {
    title: 'Tiefe Analyse',
    subtitle: 'Eine klare Begründung, kein Kennzahlen-Dashboard.',
    main: 'Hauptschluss',
    why: 'Warum',
    fail: 'Was schiefgehen kann',
    next: 'Nächster Schritt',
    change: 'Was diese Antwort ändern würde',
    evidence: 'Worauf du achten solltest',
    today: 'Heute',
    thisWeek: 'Diese Woche',
    thirtyDays: '30 Tage',
    fallback: 'Noch nicht genug Signal.',
    outcome: 'Ergebnis festhalten',
  },
  Russian: {
    title: 'Глубокий анализ',
    subtitle: 'Чистая логика решения, без имитации метрик.',
    main: 'Главный вывод',
    why: 'Почему',
    fail: 'Что может пойти не так',
    next: 'Следующий шаг',
    change: 'Что изменит этот ответ',
    evidence: 'На какие сигналы смотреть',
    today: 'Сегодня',
    thisWeek: 'На этой неделе',
    thirtyDays: '30 дней',
    fallback: 'Пока недостаточно сигнала.',
    outcome: 'Зафиксировать результат',
  },
  Arabic: {
    title: 'تحليل عميق',
    subtitle: 'مذكرة تفكير واضحة، وليست لوحة مؤشرات.',
    main: 'الخلاصة الرئيسية',
    why: 'لماذا',
    fail: 'ما الذي قد يفشل',
    next: 'الخطوة التالية',
    change: 'ما الذي سيغير هذه الإجابة',
    evidence: 'الإشارات التي يجب مراقبتها',
    today: 'اليوم',
    thisWeek: 'هذا الأسبوع',
    thirtyDays: '30 يومًا',
    fallback: 'لا توجد إشارة كافية بعد.',
    outcome: 'تسجيل النتيجة',
  },
  Spanish: {
    title: 'Análisis profundo',
    subtitle: 'Una nota de razonamiento, no un panel de métricas.',
    main: 'Conclusión principal',
    why: 'Por qué',
    fail: 'Qué puede salir mal',
    next: 'Próximo paso',
    change: 'Qué cambiaría esta respuesta',
    evidence: 'Señales a observar',
    today: 'Hoy',
    thisWeek: 'Esta semana',
    thirtyDays: '30 días',
    fallback: 'Aún no hay suficiente señal.',
    outcome: 'Registrar resultado',
  },
  Chinese: {
    title: '深度分析',
    subtitle: '清晰的推理备忘录，而不是指标面板。',
    main: '核心结论',
    why: '为什么',
    fail: '可能出问题的地方',
    next: '下一步',
    change: '什么会改变这个答案',
    evidence: '需要观察的信号',
    today: '今天',
    thisWeek: '本周',
    thirtyDays: '30天',
    fallback: '目前信号还不够。',
    outcome: '记录结果',
  },
};

function compact(value: string | undefined, fallback: string): string {
  return value?.replace(/\s+/g, ' ').trim() || fallback;
}

function firstUseful(items: Array<string | undefined>, fallback: string): string {
  return compact(items.find((item) => item && item.trim()), fallback);
}

function sectionIcon(index: number) {
  if (index === 0) return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
  if (index === 2) return <AlertTriangle className="h-4 w-4 text-amber-300" />;
  if (index === 3) return <ArrowRight className="h-4 w-4 text-purple-300" />;
  return <MessageSquareText className="h-4 w-4 text-slate-300" />;
}

function SimulationResults({
  result,
  submittedProblem,
  decisionId,
}: SimulationResultsProps) {
  const labels = labelsByLanguage[result.language || 'English'] || labelsByLanguage.English;

  const sections = useMemo(() => [
    {
      label: labels.main,
      body: compact(result.recommendation, labels.fallback),
    },
    {
      label: labels.why,
      body: firstUseful([
        result.diagnosis?.coreProblem,
        result.strategistView?.biggestUpside,
        result.economistView,
      ], labels.fallback),
    },
    {
      label: labels.fail,
      body: firstUseful([
        result.skepticView?.whatCouldBreak,
        result.redTeamCritique,
        result.diagnosis?.keyRisks,
        result.contrarianInsight?.uncomfortableTruth,
      ], labels.fallback),
    },
    {
      label: labels.next,
      body: firstUseful([
        result.actionPlan?.today,
        result.operatorNextSteps?.[0],
        result.actionPlan?.thisWeek,
      ], labels.fallback),
    },
    {
      label: labels.change,
      body: firstUseful([
        result.trustLayer?.evidenceToChange?.[0],
        result.outcomeContract?.proveMistake,
        result.trustLayer?.killCriteria,
      ], labels.fallback),
    },
  ], [labels, result]);

  const actionPlan = [
    { label: labels.today, body: result.actionPlan?.today },
    { label: labels.thisWeek, body: result.actionPlan?.thisWeek },
    { label: labels.thirtyDays, body: result.actionPlan?.thirtyDays },
  ].filter((item) => item.body?.trim());

  const evidence = [
    result.outcomeContract?.prediction30,
    result.outcomeContract?.prediction60,
    result.outcomeContract?.prediction90,
    result.trustLayer?.testBeforeCommitting?.[0],
  ].filter((item): item is string => Boolean(item?.trim())).slice(0, 4);

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-5 sm:px-6 sm:py-6">
      <div className="mb-6">
        <div className="text-[10px] font-black uppercase tracking-widest text-purple-300">SolveOS</div>
        <h2 className="mt-2 text-xl font-semibold text-[#F8FAFF]">{labels.title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">{labels.subtitle}</p>
      </div>

      <div className="space-y-3">
        {sections.map((section, index) => (
          <section key={section.label} className="rounded-xl border border-white/8 bg-[#0B1020]/54 px-4 py-4">
            <div className="flex items-center gap-2">
              {sectionIcon(index)}
              <h3 className="text-sm font-semibold text-white">{section.label}</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{section.body}</p>
          </section>
        ))}
      </div>

      {evidence.length > 0 && (
        <section className="mt-3 rounded-xl border border-white/8 bg-[#0B1020]/54 px-4 py-4">
          <h3 className="text-sm font-semibold text-white">{labels.evidence}</h3>
          <div className="mt-3 space-y-2">
            {evidence.map((item) => (
              <p key={item} className="text-sm leading-relaxed text-slate-300">{item}</p>
            ))}
          </div>
        </section>
      )}

      {actionPlan.length > 0 && (
        <section className="mt-3 rounded-xl border border-white/8 bg-[#0B1020]/54 px-4 py-4">
          <h3 className="text-sm font-semibold text-white">{labels.next}</h3>
          <div className="mt-3 space-y-3">
            {actionPlan.map((item) => (
              <div key={item.label}>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.label}</div>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {decisionId && (
        <section className="mt-3 rounded-xl border border-white/8 bg-[#0B1020]/54 px-4 py-4">
          <h3 className="text-sm font-semibold text-white">{labels.outcome}</h3>
          <OutcomeLogger
            key={decisionId}
            decisionId={decisionId}
            blueprintScore={result.score}
            problem={submittedProblem}
            blueprint={result}
            defaultOpen
          />
        </section>
      )}
    </div>
  );
}

export default memo(SimulationResults);
