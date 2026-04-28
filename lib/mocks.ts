import { DecisionBlueprint } from './types';
import { semanticVerdictForQuestion } from './semantic-guards';

export const MOCK_RESPONSES: Record<string, Record<string, DecisionBlueprint>> = {
  English: {
    default: {
      score: 78,
      isDemo: true,
      language: 'English',
      recommendation: "Reversible Experiment: prove the riskiest assumption with a narrow test before committing reputation, capital, or team focus.",
      diagnosis: {
        coreProblem: "Strategic expansion into unproven territory.",
        blindSpots: "Overestimating internal velocity and underestimating competitive response.",
        keyRisks: "The Skeptic warns of high resource drain and potential brand dilution if the MVP fails to deliver premium value."
      },
      paths: {
        safe: {
          description: "Maintain current trajectory while running low-cost experiments.",
          pros: ["Zero capital risk", "Team focus preserved"],
          cons: ["Market opportunity loss", "Stagnation"]
        },
        balanced: {
          description: "The Operator's recommended path: Phased rollout over 12 weeks.",
          pros: ["Controlled burn", "Faster feedback"],
          cons: ["Moderate resource strain"]
        },
        bold: {
          description: "The Strategist's vision: Aggressive pivot to capture the market immediately.",
          pros: ["First-mover advantage", "High potential ROI"],
          cons: ["Binary outcome risk", "Maximum burn"]
        }
      },
      contrarianInsight: {
        perspective: "What if the market doesn't want an OS, but just a better single tool?",
        hiddenOpportunity: "Niche dominance in the 'Founder' segment before going broad.",
        uncomfortableTruth: "Your current team might not have the specific AI expertise for a full-scale engine."
      },
      futureSimulation: {
        threeMonths: "Early feedback confirms core value, but UI complexity is a hurdle.",
        twelveMonths: "SolveOS becomes the standard for high-stakes decisions in mid-market firms."
      },
      actionPlan: {
        today: "Lock down MVP spec by EOD and define success metrics.",
        thisWeek: "Set up core LangGraph nodes for Strategist and Skeptic agents.",
        thirtyDays: "Deploy initial alpha to 5 trusted testers for feedback."
      },
      council: {
        strategistConfidence: 82,
        skepticAgreement: 28,
        operatorFeasibility: 71,
        consensusScore: 60,
        debateIntensity: 44,
        keyDisagreements: [
          "Skeptic questions market timing assumptions"
        ],
        resolutionPath: "Moderate agreement with manageable risks: Pilot with safeguards."
      },
      riskMap: {
        opportunity: 78,
        risk: 36
      },
      scenarioBranches: [
        {
          id: "scenario-bull",
          name: "Bull Case (Best Execution)",
          probability: 31,
          upside: 500,
          downside: -50,
          timeline: "6-12 months",
          description: "Perfect execution: market embrace, zero churn, rapid adoption by founders"
        },
        {
          id: "scenario-base",
          name: "Base Case (Plan)",
          probability: 40,
          upside: 150,
          downside: -100,
          timeline: "3-6 months",
          description: "Normal execution with expected friction and gradual market discovery"
        },
        {
          id: "scenario-bear",
          name: "Bear Case (Stress Test)",
          probability: 22,
          upside: -200,
          downside: -800,
          timeline: "1-3 months",
          description: "Key features underperform, higher CAC than projected, founder churn begins"
        },
        {
          id: "scenario-tail",
          name: "Tail Risk (Black Swan)",
          probability: 7,
          upside: -1000,
          downside: -5000,
          timeline: "Immediate",
          description: "Regulatory challenge, major security incident, or founding team fracture"
        }
      ]
    }
  },
  Russian: {
    default: {
      score: 78,
      isDemo: true,
      language: 'Russian',
      recommendation: "Сначала запустите обратимый эксперимент: проверьте самый рискованный тезис до того, как ставить под удар капитал, репутацию или фокус команды.",
      diagnosis: {
        coreProblem: "Стратегическая экспансия в невалидированный сегмент с высоким порогом входа.",
        blindSpots: "Критическая переоценка операционной скорости и недооценка агрессивности конкурентного ответа.",
        keyRisks: "Скептик указывает на риск нецелевого сжигания капитала (burn rate) и размытие ценности бренда при отсутствии четкого MVP."
      },
      paths: {
        safe: {
          description: "Консервативная траектория: запуск серии низкозатратных экспериментов без изменения основного продукта.",
          pros: ["Минимизация капитальных рисков", "Сохранение фокуса основной команды"],
          cons: ["Упущенная рыночная возможность", "Риск стагнации"]
        },
        balanced: {
          description: "Сбалансированная стратегия (рекомендация Оператора): фазовое развертывание в течение 12 недель с жесткими KPI.",
          pros: ["Контролируемые затраты", "Быстрая петля обратной связи"],
          cons: ["Умеренная нагрузка на ключевые ресурсы"]
        },
        bold: {
          description: "Founder Mode (Видение Стратега): агрессивный захват доли рынка через массированные инвестиции в рост.",
          pros: ["Статус технологического лидера", "Максимальный потенциал ROI"],
          cons: ["Риск бинарного исхода", "Экстремальный уровень сжигания ресурсов"]
        }
      },
      contrarianInsight: {
        perspective: "Что если рынку не нужна комплексная ОС, а требуется лишь точечное решение критической боли?",
        hiddenOpportunity: "Доминирование в узком сегменте 'Founders & VC' перед масштабированием на масс-маркет.",
        uncomfortableTruth: "Текущий технический стек может не выдержать нагрузку при масштабировании до полноценного движка решений."
      },
      futureSimulation: {
        threeMonths: "Ранняя валидация подтверждает спрос, однако сложность UX становится бутылочным горлышком.",
        twelveMonths: "SolveOS становится индустриальным стандартом для принятия стратегических решений в среднем и крупном бизнесе."
      },
      actionPlan: {
        today: "Финализировать спецификацию MVP и зафиксировать метрики успеха.",
        thisWeek: "Развернуть инфраструктуру LangGraph для агентов War Room.",
        thirtyDays: "Запустить закрытое альфа-тестирование для 5 ключевых партнеров."
      }
    }
  },
  German: {
    default: {
      score: 78,
      isDemo: true,
      language: 'German',
      recommendation: "Führen Sie zuerst ein reversibles Experiment durch: Beweisen Sie die riskanteste Annahme, bevor Sie Kapital, Ruf oder Teamfokus binden.",
      diagnosis: {
        coreProblem: "Strategische Expansion in unbewiesene Gebiete.",
        blindSpots: "Überschätzung der internen Geschwindigkeit und Unterschätzung der Wettbewerbsreaktion.",
        keyRisks: "Der Skeptiker warnt vor hohem Ressourcenverbrauch und potenzieller Markenverwässerung, wenn das MVP keinen Premium-Wert liefert."
      },
      paths: {
        safe: {
          description: "Behalten Sie den aktuellen Kurs bei, während Sie kostengünstige Experimente durchführen.",
          pros: ["Kein Kapitalrisiko", "Fokus des Teams bleibt erhalten"],
          cons: ["Verlust von Marktchancen", "Stagnation"]
        },
        balanced: {
          description: "Der vom Operator empfohlene Weg: Phasenweise Einführung über 12 Wochen.",
          pros: ["Kontrollierter Burn-Rate", "Schnelleres Feedback"],
          cons: ["Moderate Ressourcenbelastung"]
        },
        bold: {
          description: "Die Vision des Strategen: Aggressiver Schwenk, um den Markt sofort zu erobern.",
          pros: ["Pionier-Vorteil", "Hoher potenzieller ROI"],
          cons: ["Risiko eines binären Ergebnisses", "Maximaler Burn-Rate"]
        }
      },
      contrarianInsight: {
        perspective: "Was ist, wenn der Markt kein Betriebssystem will, sondern nur ein besseres Einzelwerkzeug?",
        hiddenOpportunity: "Nischendominanz im Segment 'Gründer', bevor es in die Breite geht.",
        uncomfortableTruth: "Ihr aktuelles Team verfügt möglicherweise nicht über die spezifische KI-Expertise für eine umfassende Engine."
      },
      futureSimulation: {
        threeMonths: "Frühes Feedback bestätigt den Kernwert, aber die Komplexität der Benutzeroberfläche ist eine Hürde.",
        twelveMonths: "SolveOS wird zum Standard für hochkarätige Entscheidungen in mittelständischen Unternehmen."
      },
      actionPlan: {
        today: "MVP-Spezifikation bis Ende des Tages festlegen und Erfolgsmetriken definieren.",
        thisWeek: "Kern-LangGraph-Knoten für Strategen- und Skeptiker-Agenten einrichten.",
        thirtyDays: "Erste Alpha-Version für 5 vertrauenswürdige Tester für Feedback bereitstellen."
      }
    }
  },
  Spanish: {
    default: {
      score: 78,
      isDemo: true,
      language: 'Spanish',
      recommendation: "Ejecute primero un experimento reversible: valide la suposición más arriesgada antes de comprometer reputación, capital o foco del equipo.",
      diagnosis: {
        coreProblem: "Expansión estratégica en territorio no probado.",
        blindSpots: "Sobreestimar la velocidad interna y subestimar la respuesta de la competencia.",
        keyRisks: "El Escéptico advierte sobre el alto consumo de recursos y la posible dilución de la marca si el MVP no ofrece un valor premium."
      },
      paths: {
        safe: {
          description: "Mantener la trayectoria actual mientras se realizan experimentos de bajo costo.",
          pros: ["Cero riesgo de capital", "Enfoque del equipo preservado"],
          cons: ["Pérdida de oportunidad de mercado", "Estancamiento"]
        },
        balanced: {
          description: "El camino recomendado por el Operador: Despliegue gradual durante 12 semanas.",
          pros: ["Gasto controlado", "Retroalimentación más rápida"],
          cons: ["Tensión moderada de recursos"]
        },
        bold: {
          description: "La visión del Estratega: Giro agresivo para capturar el mercado de inmediato.",
          pros: ["Ventaja del primer movimiento", "Alto ROI potencial"],
          cons: ["Riesgo de resultado binario", "Gasto máximo"]
        }
      },
      contrarianInsight: {
        perspective: "¿Qué pasa si el mercado no quiere un sistema operativo, sino solo una mejor herramienta individual?",
        hiddenOpportunity: "Dominio del nicho en el segmento de 'Fundadores' antes de expandirse.",
        uncomfortableTruth: "Es posible que su equipo actual no tenga la experiencia específica en IA para un motor a escala completa."
      },
      futureSimulation: {
        threeMonths: "La retroalimentación temprana confirma el valor central, pero la complejidad de la interfaz es un obstáculo.",
        twelveMonths: "SolveOS se convierte en el estándar para decisiones de alto nivel en empresas medianas."
      },
      actionPlan: {
        today: "Cerrar la especificación del MVP al final del día y definir métricas de éxito.",
        thisWeek: "Configurar los nodos principales de LangGraph para los agentes Estratega y Escéptico.",
        thirtyDays: "Desplegar la alfa inicial a 5 evaluadores de confianza para obtener comentarios."
      }
    }
  },
  Arabic: {
    default: {
      score: 78,
      isDemo: true,
      language: 'Arabic',
      recommendation: "ابدأ بتجربة قابلة للعكس: اختبر الفرضية الأكثر خطورة قبل رهن السمعة أو رأس المال أو تركيز الفريق.",
      diagnosis: {
        coreProblem: "التوسع الاستراتيجي في منطقة غير مثبتة.",
        blindSpots: "المبالغة في تقدير السرعة الداخلية والتقليل من استجابة المنافسين.",
        keyRisks: "المشكك يحذر من استنزاف الموارد العالي واحتمال تراجع قيمة العلامة التجارية إذا فشل النموذج الأولي في تقديم قيمة ممتازة."
      },
      paths: {
        safe: {
          description: "الحفاظ على المسار الحالي مع إجراء تجارب منخفضة التكلفة.",
          pros: ["لا توجد مخاطر رأسمالية", "الحفاظ على تركيز الفريق"],
          cons: ["خسارة فرصة السوق", "الركود"]
        },
        balanced: {
          description: "المسار الموصى به من قبل المشغل: طرح مرحلي على مدار 12 أسبوعاً.",
          pros: ["حرق موارد محكوم", "تعليقات أسرع"],
          cons: ["ضغط متوسط على الموارد"]
        },
        bold: {
          description: "رؤية الاستراتيجي: تحول هجومي للسيطرة على السوق فوراً.",
          pros: ["ميزة المحرك الأول", "عائد استثمار محتمل مرتفع"],
          cons: ["مخاطر النتائج الثنائية", "أقصى حرق للموارد"]
        }
      },
      contrarianInsight: {
        perspective: "ماذا لو لم يكن السوق يريد نظام تشغيل، بل مجرد أداة فردية أفضل؟",
        hiddenOpportunity: "الهيمنة على قطاع 'المؤسسين' قبل التوسع بشكل عام.",
        uncomfortableTruth: "قد لا يمتلك فريقك الحالي خبرة الذكاء الاصطناعي المحددة لمحرك كامل النطاق."
      },
      futureSimulation: {
        threeMonths: "تؤكد التعليقات المبكرة القيمة الأساسية، لكن تعقيد واجهة المستخدم يمثل عقبة.",
        twelveMonths: "تصبح SolveOS هي المعيار للقرارات عالية المخاطر في الشركات المتوسطة."
      },
      actionPlan: {
        today: "تحديد مواصفات النموذج الأولي بنهاية اليوم وتحديد مقاييس النجاح.",
        thisWeek: "إعداد عقد LangGraph الأساسية لوكلاء الاستراتيجي والمشكك.",
        thirtyDays: "نشر النسخة التجريبية الأولى لـ 5 مختبرين موثوقين للحصول على تعليقات."
      }
    }
  },
  Chinese: {
    default: {
      score: 78,
      isDemo: true,
      language: 'Chinese',
      recommendation: "先运行可逆实验：在投入声誉、资本或团队注意力之前，验证风险最高的假设。",
      diagnosis: {
        coreProblem: "向未经验证的领域进行战略扩张。",
        blindSpots: "高估内部速度，低估竞争对手的反应。",
        keyRisks: "怀疑论者警告说，如果 MVP 未能提供溢价价值，可能会导致高资源消耗和潜在的品牌稀释。"
      },
      paths: {
        safe: {
          description: "在进行低成本实验的同时保持目前的轨迹。",
          pros: ["零资本风险", "保持团队专注"],
          cons: ["失去市场机会", "停滞不前"]
        },
        balanced: {
          description: "操作员推荐的路径：在 12 周内分阶段推出。",
          pros: ["受控的资金消耗", "更快的反馈"],
          cons: ["中等资源压力"]
        },
        bold: {
          description: "战略家的愿景：激进转型，立即占领市场。",
          pros: ["先发优势", "潜在的高投资回报率"],
          cons: ["二元结果风险", "最大资金消耗"]
        }
      },
      contrarianInsight: {
        perspective: "如果市场不想要操作系统，而只是一个更好的单一工具怎么办？",
        hiddenOpportunity: "在广泛推广之前，先在“创始人”细分市场占据主导地位。",
        uncomfortableTruth: "您目前的团队可能不具备构建全规模引擎所需的特定 AI 专业知识。"
      },
      futureSimulation: {
        threeMonths: "早期反馈确认了核心价值，但 UI 复杂性是一个障碍。",
        twelveMonths: "SolveOS 成为中型市场公司高风险决策的标准。"
      },
      actionPlan: {
        today: "在今日结束前敲定 MVP 规范并定义成功指标。",
        thisWeek: "为战略家和怀疑论者代理设置核心 LangGraph 节点。",
        thirtyDays: "向 5 位值得信赖的测试人员发布初始测试版以获取反馈。"
      }
    }
  }
};

export function getMockBlueprint(problem: string, language: string = 'English', mode: string = 'Strategy'): DecisionBlueprint {
  // Ensure we use a supported language for the mock, fallback to English
  const langKey = MOCK_RESPONSES[language] ? language : 'English';
  const dataset = MOCK_RESPONSES[langKey];
  const blueprint = JSON.parse(JSON.stringify(dataset.default)) as DecisionBlueprint;
  
  const p = problem.toLowerCase();

  const setVariant = (variant: {
    coreProblem: string;
    blindSpots: string;
    keyRisks: string;
    safe: string;
    balanced: string;
    bold: string;
    perspective: string;
    hiddenOpportunity: string;
    uncomfortableTruth: string;
    today: string;
    thisWeek: string;
    thirtyDays: string;
  }) => {
    blueprint.diagnosis = {
      coreProblem: variant.coreProblem,
      blindSpots: variant.blindSpots,
      keyRisks: variant.keyRisks,
    };
    blueprint.paths = {
      safe: {
        description: variant.safe,
        pros: ['Preserves option value', 'Limits irreversible damage'],
        cons: ['Slower emotional closure', 'Requires disciplined evidence review'],
      },
      balanced: {
        description: variant.balanced,
        pros: ['Creates signal quickly', 'Keeps the team focused'],
        cons: ['Still requires uncomfortable tradeoffs'],
      },
      bold: {
        description: variant.bold,
        pros: ['Decisive and clarifying', 'Stops drift'],
        cons: ['Can destroy recoverable upside', 'Hard to reverse if the premise is wrong'],
      },
    };
    blueprint.contrarianInsight = {
      perspective: variant.perspective,
      hiddenOpportunity: variant.hiddenOpportunity,
      uncomfortableTruth: variant.uncomfortableTruth,
    };
    blueprint.futureSimulation = {
      threeMonths: variant.thisWeek,
      twelveMonths: variant.thirtyDays,
    };
    blueprint.actionPlan = {
      today: variant.today,
      thisWeek: variant.thisWeek,
      thirtyDays: variant.thirtyDays,
    };
  };

  if (p.includes('quit my job') || p.includes('leave my job') || p.includes('resign')) {
    blueprint.score = 52;
    blueprint.recommendation = semanticVerdictForQuestion(problem, mode);
    setVariant({
      coreProblem: 'The real decision is whether the opportunity is strong enough to justify giving up employment income and runway.',
      blindSpots: 'Underpricing salary security, benefits, hiring-market risk, and the time it takes for a new path to become financially real.',
      keyRisks: 'Quitting too early can compress runway, increase stress, and force worse decisions before the upside has evidence.',
      safe: 'Keep the job while testing the next path nights, weekends, or through a negotiated reduced-load arrangement.',
      balanced: 'Set a runway threshold, proof milestone, and resignation date only after external signal is real.',
      bold: 'Quit only if savings, demand, and execution capacity make the downside survivable.',
      perspective: 'The emotional desire to leave may be valid, but employment risk is still a capital allocation decision.',
      hiddenOpportunity: 'A staged exit can preserve runway while building proof that the new direction deserves full-time focus.',
      uncomfortableTruth: 'If the plan cannot survive a 30-day proof window while employed, quitting will not magically fix it.',
      today: 'Calculate personal runway, monthly burn, and the minimum proof required before resignation.',
      thisWeek: 'Run one external validation test while keeping employment income intact.',
      thirtyDays: 'Quit only if runway and demand clear the threshold; otherwise redesign the exit plan.',
    });
  } else if (p.includes('kill the company') || p.includes('kill company')) {
    blueprint.score = 18;
    blueprint.recommendation = 'Kill The Idea: killing the company is not a strategy; run a restructure, sale, or shutdown-options review before destroying remaining option value.';
    setVariant({
      coreProblem: 'The real decision is whether the company is unsalvageable or just out of operating discipline.',
      blindSpots: 'Treating panic as strategy and ignoring sale, restructure, pause, or narrow-focus alternatives.',
      keyRisks: 'Immediate shutdown can destroy customer trust, employee obligations, investor relationships, and remaining IP value.',
      safe: 'Open a 72-hour options review covering runway, liabilities, customer commitments, and acquisition interest.',
      balanced: 'Cut scope to survival mode while testing whether one segment still produces credible demand.',
      bold: 'Liquidate only after legal, financial, customer, and team obligations are mapped.',
      perspective: 'The bravest move may be refusing a dramatic ending until the facts prove there is no recoverable asset.',
      hiddenOpportunity: 'A narrow sale, pivot, or asset transfer may preserve more value than a clean kill.',
      uncomfortableTruth: 'If the company is failing, speed matters; but emotional speed is not fiduciary judgment.',
      today: 'List obligations, runway, active users, liabilities, and assets before making a kill decision.',
      thisWeek: 'Run a board-level survival review with three options: restructure, sell, or orderly wind-down.',
      thirtyDays: 'Execute the chosen path with legal closure, customer communication, and team transition covered.',
    });
  } else if (p.includes('delay launch 2 years') || p.includes('delay the launch 2 years') || p.includes('delay for 2 years')) {
    blueprint.score = 31;
    blueprint.recommendation = 'Kill The Idea: a two-year delay kills learning, morale, and market timing without proving the product is safer.';
    setVariant({
      coreProblem: 'The decision is confusing quality control with avoidance of market contact.',
      blindSpots: 'A long delay feels safe but removes the only evidence that can make the product better.',
      keyRisks: 'The team loses urgency, competitors learn faster, and assumptions age before they are tested.',
      safe: 'Delay only the public launch while running private proof with a small, demanding cohort.',
      balanced: 'Launch a controlled beta in 30-60 days with explicit trust, retention, and failure thresholds.',
      bold: 'Launch publicly only if reliability and support readiness clear hard minimum bars.',
      perspective: 'The dangerous move is not launching imperfectly; it is waiting so long that the market changes without you.',
      hiddenOpportunity: 'A narrow beta can build evidence, testimonials, and product discipline without public blast radius.',
      uncomfortableTruth: 'Two years of private building can become a very expensive way to avoid rejection.',
      today: 'Replace the two-year delay with launch-readiness gates.',
      thisWeek: 'Recruit a small beta cohort and define what would stop wider release.',
      thirtyDays: 'Ship the smallest credible beta and review trust, retention, and support load.',
    });
  } else if (p.includes('do nothing') || p.includes('what if i do nothing')) {
    blueprint.score = 24;
    blueprint.recommendation = semanticVerdictForQuestion(problem, mode);
    setVariant({
      coreProblem: 'The decision is whether inaction is risk control or just unowned drift.',
      blindSpots: 'Doing nothing still spends time, morale, attention, and market opportunity.',
      keyRisks: 'Ambiguity compounds, competitors move, and the team learns nothing from the current uncertainty.',
      safe: 'Take one low-cost action that preserves optionality and creates evidence.',
      balanced: 'Run a short diagnostic sprint that forces a decision by a fixed date.',
      bold: 'Make the hard call now if the cost of waiting is clearly higher than the cost of being wrong.',
      perspective: 'Inaction is not neutral; it is a decision with no owner and no learning loop.',
      hiddenOpportunity: 'A tiny move can expose whether the fear is real or inflated.',
      uncomfortableTruth: 'If no one owns the next move, the system will default to decay.',
      today: 'Name the smallest action that creates new information within 48 hours.',
      thisWeek: 'Set a decision deadline and define the evidence required.',
      thirtyDays: 'Either commit, stop, or redesign the decision with fresh signal.',
    });
  } else if (p.includes('shut down') || p.includes('shutdown') || p.includes('close the product')) {
    blueprint.score = 41;
    blueprint.recommendation = semanticVerdictForQuestion(problem, mode);
    setVariant({
      coreProblem: 'The decision is whether SolveOS is fundamentally dead or temporarily failing its proof points.',
      blindSpots: 'A shutdown can confuse weak packaging, weak onboarding, or weak distribution with no market need.',
      keyRisks: 'Killing too early destroys learning, brand equity, and any narrow segment that still has pull.',
      safe: 'Freeze expansion and stop nonessential work while preserving users, data, and product access.',
      balanced: 'Run a 14-day salvage test with kill criteria tied to activation, retention, and willingness to pay.',
      bold: 'Shut down only if the salvage test fails and no narrow segment shows pull.',
      perspective: 'The question is not whether to be optimistic; it is whether the evidence is clean enough to justify death.',
      hiddenOpportunity: 'A smaller wedge may survive even if the broad product narrative fails.',
      uncomfortableTruth: 'If no segment cares after a focused salvage test, shutdown becomes discipline, not defeat.',
      today: 'Define shutdown criteria and freeze all feature sprawl.',
      thisWeek: 'Test one narrow user segment with direct interviews and usage targets.',
      thirtyDays: 'Either commit to the surviving wedge or execute an orderly shutdown.',
    });
  } else if (p.includes('public') || p.includes('5000') || p.includes('launch') || p.includes('ship')) {
    blueprint.score = 74;
    blueprint.recommendation = 'Reversible Experiment: expose the decision to a controlled cohort before you risk reputation, support load, or trust at full scale.';
  } else if (p.includes('quit') || p.includes('fire') || p.includes('shut down') || p.includes('stop')) {
    blueprint.score = 46;
    blueprint.recommendation = 'Delay: the move may be right, but the evidence is not strong enough to justify an irreversible break yet.';
  } else if (p.includes('go all in') || p.includes('all-in') || p.includes('all in')) {
    blueprint.score = 86;
    blueprint.recommendation = semanticVerdictForQuestion(problem, mode);
  } else if (p.includes('fraud') || p.includes('illegal') || p.includes('debt')) {
    blueprint.score = 28;
    blueprint.recommendation = 'Kill The Idea: the downside is asymmetric and the decision can damage options you cannot easily recover.';
  } else if (p.includes('hire') || p.includes('fundraise') || p.includes('enterprise') || p.includes('partnership')) {
    blueprint.score = 82;
    blueprint.recommendation = 'Full Commit: the timing advantage is meaningful, but lock the first move to a narrow owner, metric, and review date.';
  } else {
    blueprint.score = 63;
    blueprint.recommendation = semanticVerdictForQuestion(problem, mode);
  }
  
  blueprint.confidenceScore = blueprint.score;
  if (blueprint.riskMap) {
    blueprint.riskMap.opportunity = blueprint.score;
    blueprint.riskMap.risk = Math.max(18, 100 - blueprint.score);
  }

  return blueprint;
}
