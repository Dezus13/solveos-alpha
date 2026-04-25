import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, AlertTriangle, Settings, Target, Loader2 } from 'lucide-react';

interface AgentEngineProps {
  problem: string;
  initialSolution: Record<string, unknown>;
}

interface AgentData {
  name: string;
  icon: React.ReactNode;
  tone: string;
  perspective: string;
  argument: string;
  recommendation: string;
  color: string;
}

export default function AgentEngine({ problem, initialSolution }: AgentEngineProps) {
  const [loading, setLoading] = useState(true);
  const [agentsData, setAgentsData] = useState<AgentData[]>([]);

  useEffect(() => {
    // Simulate multi-agent processing delay
    const timer = setTimeout(() => {
      const mockAgents: AgentData[] = [
        {
          name: 'Strategist',
          icon: <Brain className="w-6 h-6 text-emerald-400" />,
          tone: 'Strategic Growth & Moat',
          color: 'emerald',
          perspective: `Analyzed "${problem.substring(0, 30)}..." in tandem with the primary recommendation: "${String(initialSolution.recommendation).substring(0, 40)}...".`,
          argument: "The current market landscape is shifting. While the blueprint suggests a solid foundation, my analysis indicates that the 'Balanced Path' provides the optimal risk-to-reward ratio for building a defensible moat.",
          recommendation: "Execute the 'Balanced Path' but double down on the proprietary integration layer to ensure long-term defensibility."
        },
        {
          name: 'Skeptic',
          icon: <AlertTriangle className="w-6 h-6 text-rose-500" />,
          tone: 'Risk Mitigation',
          color: 'rose',
          perspective: "Identified 3 major blind spots in the initial blueprint diagnosis.",
          argument: "We are overestimating the user's willingness to switch from existing habits. Failure scenario: 40% churn within the first 90 days if the onboarding friction isn't reduced by half. The 'Bold Path' is currently a high-probability failure mode.",
          recommendation: "Ignore the 'Bold Path' for now. Implement the 'Safe Path' with a strict 30-day kill-switch if engagement metrics underperform."
        },
        {
          name: 'Operator',
          icon: <Settings className="w-6 h-6 text-blue-400" />,
          tone: 'Execution Efficiency',
          color: 'blue',
          perspective: "Reviewed team bandwidth and technical debt constraints.",
          argument: "The proposed action plan is linear, but we need parallelization. We lack the specific senior resources to hit the 'Today' and 'This Week' milestones simultaneously without burnout.",
          recommendation: "Outsource the initial data-mapping layer to a specialized partner while the core team focuses exclusively on the user-facing interface."
        }
      ];
      setAgentsData(mockAgents);
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [problem, initialSolution]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 260, 
        damping: 20 
      } 
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mt-12 py-20 flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="absolute -inset-4 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 relative z-10" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-medium text-white tracking-tight">Assembling the AI Board</h3>
          <p className="text-neutral-500 text-sm font-light animate-pulse">Strategist, Skeptic, and Operator are analyzing your case...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-5xl mt-12 flex flex-col space-y-8 relative pb-20"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="flex flex-col mb-4">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-300 to-neutral-500 tracking-tight">AI Board Review</h2>
        <p className="text-neutral-500 mt-1">Multi-agent dialectic analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {agentsData.map((adv, idx) => (
          <motion.div 
            variants={item}
            key={idx} 
            className="flex flex-col h-full bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-7 relative overflow-hidden group hover:bg-neutral-900/60 transition-all duration-500 shadow-2xl hover:border-white/10"
          >
            <div className={`absolute top-0 w-full h-[2px] left-0 opacity-40 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-${adv.color}-500 to-transparent`} />
            
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                {adv.icon}
              </div>
              <div>
                <h3 className="text-xl font-medium text-white tracking-tight">{adv.name}</h3>
                <p className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] mt-1 font-semibold">{adv.tone}</p>
              </div>
            </div>
            
            <div className="space-y-5 flex-grow">
              <div>
                <strong className="text-neutral-500 font-medium text-[10px] uppercase tracking-widest block mb-2 opacity-80">Perspective</strong>
                <p className="text-neutral-300 text-sm leading-relaxed antialiased">{adv.perspective}</p>
              </div>
              <div>
                <strong className="text-neutral-500 font-medium text-[10px] uppercase tracking-widest block mb-2 opacity-80">Argument</strong>
                <p className="text-neutral-300 text-sm leading-relaxed antialiased font-light">{adv.argument}</p>
              </div>
              <div>
                <strong className="text-neutral-500 font-medium text-[10px] uppercase tracking-widest block mb-2 opacity-80 font-bold text-white/40">Synthesized Verdict</strong>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm group-hover:border-white/10 transition-colors">
                  <p className="text-white font-medium text-sm leading-relaxed antialiased italic">
                  &ldquo;{adv.recommendation}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        variants={item}
        className="w-full relative z-10"
      >
        <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl opacity-30 blur-sm"></div>
        <div className="bg-neutral-950/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)]">
           <div className="absolute top-0 w-full h-[1px] left-0 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-50" />
           
           <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6">
             <div className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/30 flex-shrink-0 shadow-inner">
               <Target className="w-8 h-8 text-purple-300" />
             </div>
             
             <div className="flex-col">
               <h3 className="text-2xl font-semibold text-white tracking-tight mb-2">Omni-Agent Consensus</h3>
               <p className="text-neutral-300 text-base font-light leading-relaxed">
                 Strategically invaluable but operationally hazardous. The board recommends entering the space immediately but through a severely constrained scope. We must cut the feature set by half (Operator), validating market readiness on a shoestring budget (Skeptic) before committing the long-term capital required to build a permanent moat (Strategist).
               </p>
             </div>
           </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
