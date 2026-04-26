import { DecisionBlueprint } from './types';

export const MOCK_RESPONSES: Record<string, any> = {
  default: {
    score: 78,
    isDemo: true,
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
  },
  "hire cto": {
    score: 85,
    isDemo: true,
    recommendation: "Hire a fractional CTO immediately while starting the 6-month search for a full-time lead.",
    diagnosis: {
      coreProblem: "Critical technical leadership gap during scaling phase.",
      blindSpots: "Relying on senior devs to handle strategic architecture and hiring.",
      keyRisks: "Technical debt accumulation and lack of a cohesive hiring strategy for the engineering team."
    },
    paths: {
      safe: {
        description: "Promote an internal lead to 'Acting CTO'.",
        pros: ["Cost effective", "Cultural continuity"],
        cons: ["Lack of external experience", "Burnout risk"]
      },
      balanced: {
        description: "The Operator's recommendation: Fractional CTO (2 days/week).",
        pros: ["Expert oversight", "Scalable cost"],
        cons: ["Part-time availability"]
      },
      bold: {
        description: "Hire a high-profile CTO from a major tech firm immediately.",
        pros: ["Instant credibility", "Massive network"],
        cons: ["Extreme burn", "Cultural clash risk"]
      }
    },
    contrarianInsight: {
      perspective: "Do you actually need a CTO, or just a really good VP of Engineering?",
      hiddenOpportunity: "A 'CTO-as-a-Service' model could bridge the gap for 12 months.",
      uncomfortableTruth: "The founders' lack of technical depth is scaring off top-tier talent."
    },
    futureSimulation: {
      threeMonths: "Technical roadmap stabilized; team morale improves.",
      twelveMonths: "Successful Series A based on a robust, scalable technical foundation."
    },
    actionPlan: {
      today: "Draft CTO job description focusing on 'Vision' and 'Scale'.",
      thisWeek: "Interview 3 fractional CTO candidates to stabilize the current sprint.",
      thirtyDays: "Initiate full-time search with an executive recruiter."
    }
  }
};

export function getMockBlueprint(problem: string): any {
  const p = problem.toLowerCase();
  if (p.includes('cto')) return MOCK_RESPONSES['hire cto'];
  return MOCK_RESPONSES.default;
}
