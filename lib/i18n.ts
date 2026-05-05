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
  executionWhyNotDone: string;
  executionDoThisNow: string;
  executionCommit: string;
  executionCommitted: string;
  executionBlockerFear: string;
  executionBlockerUnclear: string;
  executionBlockerNoEnergy: string;
  executionBlockerExternal: string;
  // DecisionGate
  gateHeadline: string;
  gateSubtext: string;
  gateButton: string;
  gateHelper: string;
  gateWhatAvoiding: string;
  gateWhatCouldBreak: string;
  // ExecutionPressure / PersistentActionBanner
  pressureLabel: string;
  pressureDidYou: string;
  pressureYes: string;
  pressureNotYet: string;
  pressureWhyNotDone: string;
  pressureSmallerStep: string;
  pressureIllDoThis: string;
  pressureBack: string;
  pressureDone: string;
  pressureNext: string;
  pressureOpenCommitment: string;
  pressureStillNotDone: string;
  pressureAvoiding: string;
  pressureMissedDeadline: string;
  pressureFinishFirst: string;
  // Completion emotions
  completionDefault: string;
  completionMomentum: string;
  completionDiscipline: string;
  completionOperating: string;
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
    onboardingTitle: 'What decision are you avoiding right now?',
    onboardingSubtext: 'No more overthinking. Get a decision and a next step.',
    suggestions: ['Should I launch this?', 'Am I wasting time?', 'What am I avoiding?'],
    suggestionPrompts: [
      'Should I launch this?',
      'Am I wasting time on this idea?',
      'What am I avoiding?',
    ],
    composerPlaceholder: 'Describe the decision...',
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
    executionWhyNotDone: 'Why is this not done?',
    executionDoThisNow: 'Do this now:',
    executionCommit: 'I will do this now',
    executionCommitted: 'Committed. 24h window started.',
    executionBlockerFear: 'Fear',
    executionBlockerUnclear: 'Not clear',
    executionBlockerNoEnergy: 'No energy',
    executionBlockerExternal: 'Blocked externally',
    gateHeadline: "Want to see what's actually driving this?",
    gateSubtext: 'Unlock the hidden motivation map and 24h commitment tracker.',
    gateButton: 'Unlock full blueprint — €5',
    gateHelper: 'See what could break — before it does.',
    gateWhatAvoiding: "What you're avoiding",
    gateWhatCouldBreak: 'What could break',
    pressureLabel: 'Do this within 24h',
    pressureDidYou: 'Did you do this?',
    pressureYes: 'Yes',
    pressureNotYet: 'Not yet',
    pressureWhyNotDone: 'Why not done?',
    pressureSmallerStep: 'Smaller step',
    pressureIllDoThis: "I'll do this now",
    pressureBack: 'Back',
    pressureDone: 'Done',
    pressureNext: 'Next?',
    pressureOpenCommitment: 'You have an open commitment',
    pressureStillNotDone: 'Still not done?',
    pressureAvoiding: 'You are avoiding this',
    pressureMissedDeadline: 'You missed your deadline. Why?',
    pressureFinishFirst: 'finish your previous action first',
    completionDefault: 'Good. You execute.',
    completionMomentum: 'You are building momentum',
    completionDiscipline: 'This is discipline',
    completionOperating: 'You are operating differently now',
  },
  German: {
    appName: 'SolveOS',
    statusLive: 'Aktiv',
    statusThinking: 'Denkt',
    newChat: 'Neuer Chat',
    history: 'Verlauf',
    noDecisions: 'Noch keine Entscheidungen',
    onboardingTitle: 'Welche Entscheidung vermeidest du gerade?',
    onboardingSubtext: 'Kein Grübeln mehr. Erhalte eine Entscheidung und den nächsten Schritt.',
    suggestions: ['Soll ich das starten?', 'Verschwende ich Zeit?', 'Was vermeide ich?'],
    suggestionPrompts: [
      'Soll ich das starten?',
      'Verschwende ich Zeit mit dieser Idee?',
      'Was vermeide ich gerade?',
    ],
    composerPlaceholder: 'Entscheidung beschreiben...',
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
    executionWhyNotDone: 'Warum ist das noch nicht erledigt?',
    executionDoThisNow: 'Tu das jetzt:',
    executionCommit: 'Ich mache das jetzt',
    executionCommitted: 'Verpflichtet. 24h-Fenster gestartet.',
    executionBlockerFear: 'Angst',
    executionBlockerUnclear: 'Unklar',
    executionBlockerNoEnergy: 'Kein Antrieb',
    executionBlockerExternal: 'Extern blockiert',
    gateHeadline: 'Was treibt diese Entscheidung wirklich an?',
    gateSubtext: 'Entschlüssle deine versteckte Motivation und starte den 24h-Tracker.',
    gateButton: 'Vollständigen Plan freischalten — €5',
    gateHelper: 'Sieh, was schiefgehen könnte — bevor es passiert.',
    gateWhatAvoiding: 'Was du vermeidest',
    gateWhatCouldBreak: 'Was scheitern könnte',
    pressureLabel: 'Tu das innerhalb von 24h',
    pressureDidYou: 'Hast du das getan?',
    pressureYes: 'Ja',
    pressureNotYet: 'Noch nicht',
    pressureWhyNotDone: 'Warum nicht erledigt?',
    pressureSmallerStep: 'Kleinerer Schritt',
    pressureIllDoThis: 'Das mache ich jetzt',
    pressureBack: 'Zurück',
    pressureDone: 'Erledigt',
    pressureNext: 'Weiter?',
    pressureOpenCommitment: 'Du hast eine offene Verpflichtung',
    pressureStillNotDone: 'Noch nicht erledigt?',
    pressureAvoiding: 'Du weichst dem aus',
    pressureMissedDeadline: 'Du hast deine Frist verpasst. Warum?',
    pressureFinishFirst: 'beende zuerst deine vorherige Aufgabe',
    completionDefault: 'Gut. Du handelst.',
    completionMomentum: 'Du baust Schwung auf',
    completionDiscipline: 'Das ist Disziplin',
    completionOperating: 'Du agierst jetzt anders',
  },
  Russian: {
    appName: 'SolveOS',
    statusLive: 'Активно',
    statusThinking: 'Думает',
    newChat: 'Новый чат',
    history: 'История',
    noDecisions: 'Решений пока нет',
    onboardingTitle: 'Какое решение ты сейчас откладываешь?',
    onboardingSubtext: 'Хватит думать. Получи решение и следующий шаг.',
    suggestions: ['Стоит ли запускать?', 'Я трачу время впустую?', 'Чего я избегаю?'],
    suggestionPrompts: [
      'Стоит ли запускать это?',
      'Я трачу время впустую на эту идею?',
      'Чего я сейчас избегаю?',
    ],
    composerPlaceholder: 'Опишите решение...',
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
    executionWhyNotDone: 'Почему это ещё не сделано?',
    executionDoThisNow: 'Сделай это сейчас:',
    executionCommit: 'Я сделаю это сейчас',
    executionCommitted: 'Обязательство принято. 24-часовой таймер запущен.',
    executionBlockerFear: 'Страх',
    executionBlockerUnclear: 'Непонятно',
    executionBlockerNoEnergy: 'Нет энергии',
    executionBlockerExternal: 'Внешние блокеры',
    gateHeadline: 'Хочешь понять, что на самом деле движет этим решением?',
    gateSubtext: 'Разблокируй карту скрытых мотивов и трекер 24-часового обязательства.',
    gateButton: 'Разблокировать полный план — €5',
    gateHelper: 'Узнай, что может пойти не так — заранее.',
    gateWhatAvoiding: 'Чего ты избегаешь',
    gateWhatCouldBreak: 'Что может сломаться',
    pressureLabel: 'Сделай это в течение 24 часов',
    pressureDidYou: 'Ты это сделал?',
    pressureYes: 'Да',
    pressureNotYet: 'Ещё нет',
    pressureWhyNotDone: 'Почему не сделано?',
    pressureSmallerStep: 'Меньший шаг',
    pressureIllDoThis: 'Я сделаю это сейчас',
    pressureBack: 'Назад',
    pressureDone: 'Готово',
    pressureNext: 'Дальше?',
    pressureOpenCommitment: 'У тебя есть незавершённое обязательство',
    pressureStillNotDone: 'Всё ещё не сделано?',
    pressureAvoiding: 'Ты это избегаешь',
    pressureMissedDeadline: 'Ты пропустил дедлайн. Почему?',
    pressureFinishFirst: 'сначала заверши предыдущее действие',
    completionDefault: 'Хорошо. Ты действуешь.',
    completionMomentum: 'Ты набираешь темп',
    completionDiscipline: 'Это дисциплина',
    completionOperating: 'Ты работаешь по-другому теперь',
  },
  Arabic: {
    appName: 'SolveOS',
    statusLive: 'نشط',
    statusThinking: 'يفكر',
    newChat: 'محادثة جديدة',
    history: 'السجل',
    noDecisions: 'لا توجد قرارات بعد',
    onboardingTitle: 'ما القرار الذي تتهرب منه الآن؟',
    onboardingSubtext: 'لا مزيد من التفكير. احصل على قرار والخطوة التالية.',
    suggestions: ['هل أطلق هذا؟', 'هل أضيع وقتي؟', 'ماذا أتجنب؟'],
    suggestionPrompts: [
      'هل يجب أن أطلق هذا؟',
      'هل أضيع وقتي في هذه الفكرة؟',
      'ماذا أتجنب الآن؟',
    ],
    composerPlaceholder: 'صف قرارك...',
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
    executionWhyNotDone: 'لماذا لم يُنجز هذا بعد؟',
    executionDoThisNow: 'افعل هذا الآن:',
    executionCommit: 'سأفعل هذا الآن',
    executionCommitted: 'التزمت. نافذة 24 ساعة بدأت.',
    executionBlockerFear: 'خوف',
    executionBlockerUnclear: 'غير واضح',
    executionBlockerNoEnergy: 'لا طاقة',
    executionBlockerExternal: 'محجوب خارجياً',
    gateHeadline: 'هل تريد معرفة ما يحرك هذا القرار فعلاً؟',
    gateSubtext: 'افتح خريطة الدوافع الخفية ومتتبع الالتزام لـ 24 ساعة.',
    gateButton: 'فتح الخطة الكاملة — €5',
    gateHelper: 'اعرف ما قد ينكسر — قبل أن يحدث.',
    gateWhatAvoiding: 'ما تتجنبه',
    gateWhatCouldBreak: 'ما قد ينكسر',
    pressureLabel: 'افعل هذا خلال 24 ساعة',
    pressureDidYou: 'هل فعلت هذا؟',
    pressureYes: 'نعم',
    pressureNotYet: 'ليس بعد',
    pressureWhyNotDone: 'لماذا لم يُنجز؟',
    pressureSmallerStep: 'خطوة أصغر',
    pressureIllDoThis: 'سأفعل هذا الآن',
    pressureBack: 'رجوع',
    pressureDone: 'تم',
    pressureNext: 'التالي؟',
    pressureOpenCommitment: 'لديك التزام مفتوح',
    pressureStillNotDone: 'لم يُنجز بعد؟',
    pressureAvoiding: 'أنت تتجنب هذا',
    pressureMissedDeadline: 'فاتك الموعد النهائي. لماذا؟',
    pressureFinishFirst: 'أنهِ إجراءك السابق أولاً',
    completionDefault: 'جيد. أنت تتصرف.',
    completionMomentum: 'أنت تبني الزخم',
    completionDiscipline: 'هذا انضباط',
    completionOperating: 'أنت تعمل بشكل مختلف الآن',
  },
  Spanish: {
    appName: 'SolveOS',
    statusLive: 'Activo',
    statusThinking: 'Pensando',
    newChat: 'Nuevo chat',
    history: 'Historial',
    noDecisions: 'Aún no hay decisiones',
    onboardingTitle: '¿Qué decisión estás evitando ahora mismo?',
    onboardingSubtext: 'No más dudas. Obtén una decisión y el próximo paso.',
    suggestions: ['¿Debería lanzar esto?', '¿Estoy perdiendo el tiempo?', '¿Qué estoy evitando?'],
    suggestionPrompts: [
      '¿Debería lanzar esto?',
      '¿Estoy perdiendo el tiempo con esta idea?',
      '¿Qué estoy evitando ahora mismo?',
    ],
    composerPlaceholder: 'Describe la decisión...',
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
    executionWhyNotDone: '¿Por qué esto no está hecho?',
    executionDoThisNow: 'Haz esto ahora:',
    executionCommit: 'Lo haré ahora mismo',
    executionCommitted: 'Comprometido. Ventana de 24h iniciada.',
    executionBlockerFear: 'Miedo',
    executionBlockerUnclear: 'No está claro',
    executionBlockerNoEnergy: 'Sin energía',
    executionBlockerExternal: 'Bloqueado externamente',
    gateHeadline: '¿Quieres ver qué impulsa realmente esta decisión?',
    gateSubtext: 'Desbloquea el mapa de motivaciones ocultas y el rastreador de 24h.',
    gateButton: 'Desbloquear plan completo — €5',
    gateHelper: 'Ve lo que podría fallar — antes de que ocurra.',
    gateWhatAvoiding: 'Lo que estás evitando',
    gateWhatCouldBreak: 'Lo que podría fallar',
    pressureLabel: 'Haz esto en 24h',
    pressureDidYou: '¿Lo hiciste?',
    pressureYes: 'Sí',
    pressureNotYet: 'Aún no',
    pressureWhyNotDone: '¿Por qué no está hecho?',
    pressureSmallerStep: 'Paso más pequeño',
    pressureIllDoThis: 'Lo haré ahora',
    pressureBack: 'Atrás',
    pressureDone: 'Hecho',
    pressureNext: '¿Siguiente?',
    pressureOpenCommitment: 'Tienes un compromiso abierto',
    pressureStillNotDone: '¿Aún no está hecho?',
    pressureAvoiding: 'Estás evitando esto',
    pressureMissedDeadline: 'Perdiste tu plazo. ¿Por qué?',
    pressureFinishFirst: 'termina primero tu acción anterior',
    completionDefault: 'Bien. Actúas.',
    completionMomentum: 'Estás ganando impulso',
    completionDiscipline: 'Esto es disciplina',
    completionOperating: 'Estás operando de forma diferente',
  },
  Chinese: {
    appName: 'SolveOS',
    statusLive: '在线',
    statusThinking: '思考中',
    newChat: '新聊天',
    history: '历史',
    noDecisions: '还没有决策',
    onboardingTitle: '你现在在回避哪个决策？',
    onboardingSubtext: '不要再犹豫了。做出决定，迈出下一步。',
    suggestions: ['我该发布吗？', '我在浪费时间吗？', '我在回避什么？'],
    suggestionPrompts: [
      '我该发布这个吗？',
      '我在浪费时间在这个想法上吗？',
      '我现在在回避什么？',
    ],
    composerPlaceholder: '描述你的决策...',
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
    executionWhyNotDone: '为什么这件事还没做？',
    executionDoThisNow: '现在做这件事：',
    executionCommit: '我现在就去做',
    executionCommitted: '已承诺。24小时倒计时开始。',
    executionBlockerFear: '恐惧',
    executionBlockerUnclear: '不清楚',
    executionBlockerNoEnergy: '没有动力',
    executionBlockerExternal: '外部阻碍',
    gateHeadline: '想了解真正驱动这个决策的是什么吗？',
    gateSubtext: '解锁隐藏动机图谱和24小时承诺追踪器。',
    gateButton: '解锁完整方案 — €5',
    gateHelper: '提前了解可能出现的问题。',
    gateWhatAvoiding: '你在回避什么',
    gateWhatCouldBreak: '可能出问题的是什么',
    pressureLabel: '在24小时内完成',
    pressureDidYou: '你做到了吗？',
    pressureYes: '是',
    pressureNotYet: '还没有',
    pressureWhyNotDone: '为什么还没做？',
    pressureSmallerStep: '更小的步骤',
    pressureIllDoThis: '我现在就去做',
    pressureBack: '返回',
    pressureDone: '完成',
    pressureNext: '下一步？',
    pressureOpenCommitment: '你有一个未完成的承诺',
    pressureStillNotDone: '还没做完？',
    pressureAvoiding: '你在回避这件事',
    pressureMissedDeadline: '你错过了截止日期。为什么？',
    pressureFinishFirst: '先完成之前的行动',
    completionDefault: '好。你在行动。',
    completionMomentum: '你正在积累动力',
    completionDiscipline: '这是纪律',
    completionOperating: '你现在的方式不同了',
  },
};

const russianTransliterationStrong = [
  'privet',
  'kak dela',
  'chto',
  'cto',
  'delat',
  'dalshe',
  'daljshe',
  'hochu',
  'hochyu',
  'nuzhno',
  'reshenie',
  'resenie',
  'pochemu',
  'spasibo',
  'biznes reshenie',
];

const russianTransliterationWeak = [
  'ya',
  'mne',
  'menya',
  'mozhno',
  'mozhet',
  'stoit',
  'rabota',
  'dengi',
  'biznes',
  'sdelat',
  'kuda',
  'kogda',
];

function hasRussianTransliteration(text: string): boolean {
  const lower = text.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!lower) return false;
  if (russianTransliterationStrong.some((keyword) => new RegExp(`(^|\\s)${keyword}(\\s|$)`).test(lower))) {
    return true;
  }
  const weakHits = russianTransliterationWeak.filter((keyword) => new RegExp(`(^|\\s)${keyword}(\\s|$)`).test(lower));
  return weakHits.length >= 2;
}

export function detectInputLanguage(
  text: string,
  fallback: Exclude<SupportedLanguage, 'auto'> = 'English',
): Exclude<SupportedLanguage, 'auto'> {
  if (/[\u0600-\u06FF]/.test(text)) return 'Arabic';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'Chinese';
  if (/[\u0400-\u04FF]/.test(text)) return 'Russian';
  const lower = text.toLowerCase();
  if (hasRussianTransliteration(text)) return 'Russian';
  if (/[äöüß]/i.test(text) || /\b(und|oder|nicht|sollten|entscheidung|risiko)\b/.test(lower)) return 'German';
  if (/[áéíóúñ¿¡]/i.test(text) || /\b(deberíamos|riesgo|decisión|crecimiento|próximo)\b/.test(lower)) return 'Spanish';
  return fallback;
}
