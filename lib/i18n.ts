export type SupportedLanguage = 'auto' | 'English' | 'German' | 'Russian' | 'Arabic' | 'Spanish' | 'Chinese';

export interface UiCopy {
  appName: string;
  statusLive: string;
  statusThinking: string;
  newChat: string;
  history: string;
  noDecisions: string;
  onboardingTitle: string;
  onboardingSubtext: string;
  suggestions: string[];
  suggestionPrompts: string[];
  composerPlaceholder: string;
  emptyPromptError: string;
  shortPromptError: string;
  reasoning: string;
  copySummary: string;
  copied: string;
  helpful: string;
  unhelpful: string;
  advancedAnalysis: string;
  advancedSubtext: string;
  settings: string;
  general: string;
  language: string;
  appearance: string;
  notifications: string;
  data: string;
  security: string;
  verdict: string;
  reasoningHeading: string;
  risks: string;
  nextMove: string;
  redTeamChallenge: string;
}

export const languageOptions: Array<{ id: SupportedLanguage; label: string; nativeLabel: string }> = [
  { id: 'auto', label: 'Auto', nativeLabel: 'Auto' },
  { id: 'English', label: 'English', nativeLabel: 'English' },
  { id: 'German', label: 'German', nativeLabel: 'Deutsch' },
  { id: 'Russian', label: 'Russian', nativeLabel: 'Русский' },
  { id: 'Arabic', label: 'Arabic', nativeLabel: 'العربية' },
  { id: 'Spanish', label: 'Spanish', nativeLabel: 'Español' },
  { id: 'Chinese', label: 'Chinese', nativeLabel: '中文' },
];

export const concreteLanguageOptions = languageOptions.filter(
  (language): language is { id: Exclude<SupportedLanguage, 'auto'>; label: string; nativeLabel: string } => language.id !== 'auto'
);

export const uiCopy: Record<Exclude<SupportedLanguage, 'auto'>, UiCopy> = {
  English: {
    appName: 'SolveOS',
    statusLive: 'Live',
    statusThinking: 'Thinking',
    newChat: 'New chat',
    history: 'History',
    noDecisions: 'No decisions yet',
    onboardingTitle: 'Think through hard decisions with an AI decision partner.',
    onboardingSubtext: 'Stress-test options, surface risks, and get a clear next move.',
    suggestions: ['Launch beta?', 'Find hidden risks', '30-day scorecard'],
    suggestionPrompts: [
      'Should we launch to 300 beta users next month?',
      'What risks could break our current growth plan?',
      'Give me a 30-day review scorecard with kill criteria.',
    ],
    composerPlaceholder: 'Ask SolveOS...',
    emptyPromptError: 'Type a decision or direct request first.',
    shortPromptError: 'Decision details too brief. Add stakes, constraints, or timeline.',
    reasoning: 'SolveOS is reasoning...',
    copySummary: 'Copy summary',
    copied: 'Copied',
    helpful: 'Helpful response',
    unhelpful: 'Unhelpful response',
    advancedAnalysis: 'Advanced Analysis',
    advancedSubtext: 'Risk, scenarios, memory, and operator detail',
    settings: 'Settings',
    general: 'General',
    language: 'Language',
    appearance: 'Appearance',
    notifications: 'Notifications',
    data: 'Data',
    security: 'Security',
    verdict: 'Verdict',
    reasoningHeading: 'Reasoning',
    risks: 'Risks',
    nextMove: 'Next move',
    redTeamChallenge: 'Red-team challenge',
  },
  German: {
    appName: 'SolveOS',
    statusLive: 'Aktiv',
    statusThinking: 'Denkt',
    newChat: 'Neuer Chat',
    history: 'Verlauf',
    noDecisions: 'Noch keine Entscheidungen',
    onboardingTitle: 'Durchdenken Sie schwierige Entscheidungen mit einem KI-Entscheidungspartner.',
    onboardingSubtext: 'Optionen stress-testen, Risiken sichtbar machen und den nächsten klaren Schritt erhalten.',
    suggestions: ['Beta starten?', 'Risiken finden', '30-Tage-Scorecard'],
    suggestionPrompts: [
      'Sollten wir nächsten Monat mit 300 Beta-Nutzern starten?',
      'Welche Risiken könnten unseren aktuellen Wachstumsplan gefährden?',
      'Gib mir eine 30-Tage-Scorecard mit Abbruchkriterien.',
    ],
    composerPlaceholder: 'SolveOS fragen...',
    emptyPromptError: 'Geben Sie zuerst eine Entscheidung oder Anfrage ein.',
    shortPromptError: 'Zu wenig Kontext. Ergänzen Sie Einsatz, Grenzen oder Zeitrahmen.',
    reasoning: 'SolveOS denkt nach...',
    copySummary: 'Zusammenfassung kopieren',
    copied: 'Kopiert',
    helpful: 'Hilfreiche Antwort',
    unhelpful: 'Nicht hilfreiche Antwort',
    advancedAnalysis: 'Erweiterte Analyse',
    advancedSubtext: 'Risiko, Szenarien, Gedächtnis und Umsetzung',
    settings: 'Einstellungen',
    general: 'Allgemein',
    language: 'Sprache',
    appearance: 'Darstellung',
    notifications: 'Benachrichtigungen',
    data: 'Daten',
    security: 'Sicherheit',
    verdict: 'Urteil',
    reasoningHeading: 'Begründung',
    risks: 'Risiken',
    nextMove: 'Nächster Schritt',
    redTeamChallenge: 'Red-Team-Prüfung',
  },
  Russian: {
    appName: 'SolveOS',
    statusLive: 'Активно',
    statusThinking: 'Думает',
    newChat: 'Новый чат',
    history: 'История',
    noDecisions: 'Решений пока нет',
    onboardingTitle: 'Продумывайте сложные решения с AI-партнёром.',
    onboardingSubtext: 'Проверяйте варианты, находите риски и получайте ясный следующий шаг.',
    suggestions: ['Запуск beta?', 'Найти риски', 'Скоркард 30 дней'],
    suggestionPrompts: [
      'Стоит ли запускать продукт на 300 beta-пользователей в следующем месяце?',
      'Какие риски могут сломать наш текущий план роста?',
      'Дай 30-дневный скоркард с критериями остановки.',
    ],
    composerPlaceholder: 'Спросите SolveOS...',
    emptyPromptError: 'Сначала введите решение или запрос.',
    shortPromptError: 'Слишком мало контекста. Добавьте ставки, ограничения или сроки.',
    reasoning: 'SolveOS размышляет...',
    copySummary: 'Скопировать summary',
    copied: 'Скопировано',
    helpful: 'Полезный ответ',
    unhelpful: 'Неполезный ответ',
    advancedAnalysis: 'Расширенный анализ',
    advancedSubtext: 'Риски, сценарии, память и операционный план',
    settings: 'Настройки',
    general: 'Основное',
    language: 'Язык',
    appearance: 'Внешний вид',
    notifications: 'Уведомления',
    data: 'Данные',
    security: 'Безопасность',
    verdict: 'Вердикт',
    reasoningHeading: 'Логика',
    risks: 'Риски',
    nextMove: 'Следующий шаг',
    redTeamChallenge: 'Red-team проверка',
  },
  Arabic: {
    appName: 'SolveOS',
    statusLive: 'نشط',
    statusThinking: 'يفكر',
    newChat: 'محادثة جديدة',
    history: 'السجل',
    noDecisions: 'لا توجد قرارات بعد',
    onboardingTitle: 'فكّر في القرارات الصعبة مع شريك قرار ذكي.',
    onboardingSubtext: 'اختبر الخيارات، اكشف المخاطر، واحصل على خطوة تالية واضحة.',
    suggestions: ['إطلاق بيتا؟', 'كشف المخاطر', 'بطاقة 30 يومًا'],
    suggestionPrompts: [
      'هل يجب أن نطلق النسخة التجريبية لـ 300 مستخدم الشهر القادم؟',
      'ما المخاطر التي قد تكسر خطة النمو الحالية؟',
      'أعطني بطاقة مراجعة لمدة 30 يومًا مع معايير إيقاف.',
    ],
    composerPlaceholder: 'اسأل SolveOS...',
    emptyPromptError: 'اكتب قرارًا أو طلبًا أولًا.',
    shortPromptError: 'التفاصيل قليلة جدًا. أضف الرهانات أو القيود أو الإطار الزمني.',
    reasoning: 'SolveOS يفكر...',
    copySummary: 'نسخ الملخص',
    copied: 'تم النسخ',
    helpful: 'إجابة مفيدة',
    unhelpful: 'إجابة غير مفيدة',
    advancedAnalysis: 'تحليل متقدم',
    advancedSubtext: 'المخاطر والسيناريوهات والذاكرة وخطة التنفيذ',
    settings: 'الإعدادات',
    general: 'عام',
    language: 'اللغة',
    appearance: 'المظهر',
    notifications: 'الإشعارات',
    data: 'البيانات',
    security: 'الأمان',
    verdict: 'الحكم',
    reasoningHeading: 'المنطق',
    risks: 'المخاطر',
    nextMove: 'الخطوة التالية',
    redTeamChallenge: 'تحدي الفريق الأحمر',
  },
  Spanish: {
    appName: 'SolveOS',
    statusLive: 'Activo',
    statusThinking: 'Pensando',
    newChat: 'Nuevo chat',
    history: 'Historial',
    noDecisions: 'Aún no hay decisiones',
    onboardingTitle: 'Piensa decisiones difíciles con un socio de decisión de IA.',
    onboardingSubtext: 'Pon a prueba opciones, descubre riesgos y obtén un próximo paso claro.',
    suggestions: ['¿Lanzar beta?', 'Encontrar riesgos', 'Scorecard 30 días'],
    suggestionPrompts: [
      '¿Deberíamos lanzar a 300 usuarios beta el próximo mes?',
      '¿Qué riesgos podrían romper nuestro plan de crecimiento actual?',
      'Dame una scorecard de 30 días con criterios de cancelación.',
    ],
    composerPlaceholder: 'Pregunta a SolveOS...',
    emptyPromptError: 'Escribe primero una decisión o solicitud.',
    shortPromptError: 'Falta contexto. Añade apuestas, restricciones o plazo.',
    reasoning: 'SolveOS está pensando...',
    copySummary: 'Copiar resumen',
    copied: 'Copiado',
    helpful: 'Respuesta útil',
    unhelpful: 'Respuesta poco útil',
    advancedAnalysis: 'Análisis avanzado',
    advancedSubtext: 'Riesgo, escenarios, memoria y ejecución',
    settings: 'Preferencias',
    general: 'General',
    language: 'Idioma',
    appearance: 'Apariencia',
    notifications: 'Notificaciones',
    data: 'Datos',
    security: 'Seguridad',
    verdict: 'Veredicto',
    reasoningHeading: 'Razonamiento',
    risks: 'Riesgos',
    nextMove: 'Próximo paso',
    redTeamChallenge: 'Desafío red-team',
  },
  Chinese: {
    appName: 'SolveOS',
    statusLive: '在线',
    statusThinking: '思考中',
    newChat: '新聊天',
    history: '历史',
    noDecisions: '还没有决策',
    onboardingTitle: '和 AI 决策伙伴一起思考艰难选择。',
    onboardingSubtext: '压力测试选项，暴露风险，并得到清晰的下一步。',
    suggestions: ['发布 beta？', '找隐藏风险', '30 天评分卡'],
    suggestionPrompts: [
      '我们下个月应该向 300 名 beta 用户发布吗？',
      '哪些风险可能破坏当前增长计划？',
      '给我一份包含停止标准的 30 天评分卡。',
    ],
    composerPlaceholder: '询问 SolveOS...',
    emptyPromptError: '请先输入一个决策或请求。',
    shortPromptError: '决策信息太少。请补充利害关系、限制或时间线。',
    reasoning: 'SolveOS 正在思考...',
    copySummary: '复制摘要',
    copied: '已复制',
    helpful: '有帮助',
    unhelpful: '没有帮助',
    advancedAnalysis: '高级分析',
    advancedSubtext: '风险、情景、记忆和执行细节',
    settings: '设置',
    general: '通用',
    language: '语言',
    appearance: '外观',
    notifications: '通知',
    data: '数据',
    security: '安全',
    verdict: '结论',
    reasoningHeading: '推理',
    risks: '风险',
    nextMove: '下一步',
    redTeamChallenge: '红队挑战',
  },
};

export function detectInputLanguage(text: string): Exclude<SupportedLanguage, 'auto'> {
  if (/[\u0600-\u06FF]/.test(text)) return 'Arabic';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'Chinese';
  if (/[\u0400-\u04FF]/.test(text)) return 'Russian';
  const lower = text.toLowerCase();
  if (/[äöüß]/i.test(text) || /\b(und|oder|nicht|sollten|entscheidung|risiko)\b/.test(lower)) return 'German';
  if (/[áéíóúñ¿¡]/i.test(text) || /\b(deberíamos|riesgo|decisión|crecimiento|próximo)\b/.test(lower)) return 'Spanish';
  return 'English';
}
