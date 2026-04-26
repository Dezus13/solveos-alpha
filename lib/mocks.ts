import { DecisionBlueprint } from './types';

export const MOCK_RESPONSES: Record<string, Record<string, any>> = {
  English: {
    default: {
      score: 78,
      isDemo: true,
      language: 'English',
      recommendation: "Proceed with a measured, phased approach. The opportunity is real, but execution complexity requires careful management.",
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
      }
    }
  },
  Russian: {
    default: {
      score: 78,
      isDemo: true,
      language: 'Russian',
      recommendation: "Действуйте взвешенно и поэтапно. Возможность реальна, но сложность реализации требует тщательного управления.",
      diagnosis: {
        coreProblem: "Стратегическое расширение на непроверенную территорию.",
        blindSpots: "Переоценка внутренней скорости и недооценка реакции конкурентов.",
        keyRisks: "Скептик предупреждает о больших затратах ресурсов и возможном размытии бренда, если MVP не принесет премиальной ценности."
      },
      paths: {
        safe: {
          description: "Сохраняйте текущую траекторию, проводя недорогие эксперименты.",
          pros: ["Нулевой капитальный риск", "Сохранение фокуса команды"],
          cons: ["Упущенная рыночная возможность", "Стагнация"]
        },
        balanced: {
          description: "Рекомендуемый путь Оператора: поэтапное развертывание в течение 12 недель.",
          pros: ["Контролируемые затраты", "Быстрая обратная связь"],
          cons: ["Умеренная нагрузка на ресурсы"]
        },
        bold: {
          description: "Видение Стратега: агрессивный поворот для немедленного захвата рынка.",
          pros: ["Преимущество первопроходца", "Высокий потенциальный ROI"],
          cons: ["Риск бинарного исхода", "Максимальные затраты"]
        }
      },
      contrarianInsight: {
        perspective: "Что если рынку не нужна ОС, а просто лучший отдельный инструмент?",
        hiddenOpportunity: "Доминирование в нише 'основателей' перед выходом на широкий рынок.",
        uncomfortableTruth: "У вашей текущей команды может не быть специфического опыта в ИИ для полноценного движка."
      },
      futureSimulation: {
        threeMonths: "Первые отзывы подтверждают основную ценность, но сложность интерфейса является препятствием.",
        twelveMonths: "SolveOS становится стандартом для принятия важных решений в компаниях среднего бизнеса."
      },
      actionPlan: {
        today: "Утвердить спецификацию MVP к концу дня и определить метрики успеха.",
        thisWeek: "Настроить основные узлы LangGraph для агентов Стратега и Скептика.",
        thirtyDays: "Развернуть начальную альфа-версию для 5 доверенных тестеров для обратной связи."
      }
    }
  },
  German: {
    default: {
      score: 78,
      isDemo: true,
      language: 'German',
      recommendation: "Gehen Sie mit einem gemessenen, phasenweisen Ansatz vor. Die Chance ist real, aber die Komplexität der Ausführung erfordert sorgfältiges Management.",
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
  }
};

export function getMockBlueprint(problem: string, language: string = 'English'): any {
  // Ensure we use a supported language for the mock, fallback to English
  const langKey = MOCK_RESPONSES[language] ? language : 'English';
  const dataset = MOCK_RESPONSES[langKey];
  
  const p = problem.toLowerCase();
  // We could add more specific keyword matching per language if needed
  if (p.includes('cto') || p.includes('директор') || p.includes('technischer')) {
    // For simplicity, returning localized default or a specific localized mock if we built them
    return dataset.default; 
  }
  
  return dataset.default;
}
