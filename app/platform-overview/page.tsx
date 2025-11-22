"use client"

import React from 'react'
import { 
  Rocket, 
  Zap, 
  Brain, 
  Cpu, 
  Globe, 
  Shield, 
  Users, 
  BarChart3, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Layers,
  Activity,
  Search
} from 'lucide-react'

export default function PlatformOverview() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm mb-8 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              SYSTEM VERSION: 2025.11 (NEXT-GEN)
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-cyan-400">
              THE SHOREAGENTS OS
            </h1>
            <p className="text-2xl md:text-3xl text-cyan-200/70 mb-8 font-light">
              Human Talent × Artificial Intelligence × Neural Collaboration
            </p>
            <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto">
              Stop Managing People. Start Managing Outcomes. Upgrade your workforce with Augmented Work Units—humans enhanced by AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_40px_rgba(6,182,212,0.7)] flex items-center justify-center gap-2">
                <Rocket className="w-5 h-5" />
                START DEPLOYMENT
              </button>
              <button className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 rounded-lg transition-all flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                VIEW SYSTEM DEMO
              </button>
            </div>
          </div>
        </div>
        
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      </section>

      {/* The Vision */}
      <section className="py-24 bg-slate-950 relative">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-400" />
                THE VISION
              </h2>
              <p className="text-xl text-slate-300 mb-6 leading-relaxed">
                ShoreAgents is not a BPO. It is a <span className="text-cyan-400 font-semibold">Workforce Operating System</span> that merges elite Filipino talent with agentic AI, real-time telemetry, and neural collaboration tools.
              </p>
              <ul className="space-y-4">
                {[
                  "Zero-Friction Deployment",
                  "Real-time Neural Telemetry",
                  "Agentic AI Companions",
                  "Self-Optimizing Teams"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-400">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              {/* Pseudo-code visual for "The System" */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 group-hover:opacity-100 transition-opacity opacity-50"></div>
                <div className="font-mono text-xs text-slate-400 space-y-2">
                  <div className="flex justify-between text-slate-600 border-b border-slate-800 pb-2 mb-4">
                    <span>SYSTEM_STATUS: OPERATIONAL</span>
                    <span className="text-green-500">● ONLINE</span>
                  </div>
                  <div className="pl-4 border-l-2 border-purple-500/30">
                    <span className="text-purple-400">class</span> <span className="text-yellow-200">ShoreAgentsOS</span> <span className="text-slate-300">{`{`}</span>
                  </div>
                  <div className="pl-8 border-l-2 border-purple-500/30">
                    <span className="text-cyan-400">deployUnit</span><span className="text-slate-300">(</span><span className="text-orange-300">talentId</span><span className="text-slate-300">) {`{`}</span>
                  </div>
                  <div className="pl-12 border-l-2 border-purple-500/30 text-slate-500">
                    <span className="text-green-400">await</span> Onboarding.verify(biometrics);
                  </div>
                  <div className="pl-12 border-l-2 border-purple-500/30 text-slate-500">
                    <span className="text-green-400">await</span> AI.injectContext(companySOPs);
                  </div>
                  <div className="pl-12 border-l-2 border-purple-500/30 text-slate-500">
                    <span className="text-purple-400">return</span> new AugmentedWorker();
                  </div>
                  <div className="pl-8 border-l-2 border-purple-500/30">
                    <span className="text-slate-300">{`}`}</span>
                  </div>
                  <div className="pl-4 border-l-2 border-purple-500/30">
                    <span className="text-slate-300">{`}`}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Diagram */}
      <section className="py-24 bg-slate-900/50 border-y border-slate-800">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold text-white mb-16">THE ZERO-FRICTION LOOP</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-cyan-500/0 -translate-y-1/2 z-0"></div>

            {[
              { icon: Search, title: "Talent Discovery", time: "5 Mins" },
              { icon: Users, title: "AI Interview", time: "24 Hours" },
              { icon: Rocket, title: "Deployment", time: "Day 1" },
              { icon: Cpu, title: "Augmented Ops", time: "Ongoing" },
              { icon: BarChart3, title: "AI Growth", time: "Continuous" }
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center mb-4">
                  <step.icon className="w-8 h-8 text-cyan-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-white font-semibold mb-1">{step.title}</h3>
                <span className="text-xs text-cyan-500 font-mono bg-cyan-950/50 px-2 py-1 rounded border border-cyan-900">{step.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Phases Grid */}
      <section className="py-24 bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Phase 1 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 hover:bg-slate-800/50 transition-all group">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">PHASE 1: INTELLIGENT DISCOVERY</h3>
              <p className="text-slate-400 text-sm mb-4">"Precision Matching via Neural Filters"</p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-blue-400 rounded-full"></span>Skill Radar Visualization</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-blue-400 rounded-full"></span>Psychometric Sync</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-blue-400 rounded-full"></span>Voiceprint Analysis</li>
              </ul>
            </div>

            {/* Phase 2 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 hover:bg-slate-800/50 transition-all group">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Rocket className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">PHASE 2: HYPER-SPEED ONBOARDING</h3>
              <p className="text-slate-400 text-sm mb-4">"From Contract to Cloud in 24 Hours"</p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-green-400 rounded-full"></span>Digital Airlock Protocol</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-green-400 rounded-full"></span>Bio-Auth Signature</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-green-400 rounded-full"></span>Auto-Verification Loop</li>
              </ul>
            </div>

            {/* Phase 3 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 hover:bg-slate-800/50 transition-all group">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">PHASE 3: AUGMENTED OPERATIONS</h3>
              <p className="text-slate-400 text-sm mb-4">"The Cyborg Workforce"</p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-purple-400 rounded-full"></span>SA-AI Neural Companion</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-purple-400 rounded-full"></span>RAG Memory Core</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-purple-400 rounded-full"></span>"God Mode" Telemetry</li>
              </ul>
            </div>

            {/* Phase 4 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 hover:bg-slate-800/50 transition-all group">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">PHASE 4: NEURAL COLLABORATION</h3>
              <p className="text-slate-400 text-sm mb-4">"Work at the Speed of Thought"</p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-orange-400 rounded-full"></span>Universal Synapse Chat</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-orange-400 rounded-full"></span>Reaction Protocol</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-orange-400 rounded-full"></span>Context-Aware Collaboration</li>
              </ul>
            </div>

            {/* Phase 5 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 hover:bg-slate-800/50 transition-all group">
              <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">PHASE 5: ALGORITHMIC GROWTH</h3>
              <p className="text-slate-400 text-sm mb-4">"Self-Optimizing Teams"</p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-pink-400 rounded-full"></span>Performance Node Analysis</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-pink-400 rounded-full"></span>Auto-Suggest Training</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-pink-400 rounded-full"></span>Predictive Success Modeling</li>
              </ul>
            </div>
             
             {/* Future Roadmap */}
             <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 hover:bg-slate-800/50 transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_14px] opacity-20"></div>
                <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-cyan-400 animate-spin-slow" />
                </div>
                <div className="flex items-center justify-between mb-2">
                   <h3 className="text-xl font-bold text-white">PROJECT AGENTIC</h3>
                   <span className="text-xs font-mono text-cyan-500 animate-pulse">LOADING... 80%</span>
                </div>
                <div className="w-full bg-slate-800 h-1 mb-4 rounded-full overflow-hidden">
                   <div className="h-full bg-cyan-500 w-[80%]"></div>
                </div>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-cyan-400 rounded-full"></span>Holo-Sync Voice Translation</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-cyan-400 rounded-full"></span>Auto-Pilot (Tier 2 Automation)</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-cyan-400 rounded-full"></span>Predictive Scaling</li>
                </ul>
              </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Advantage */}
      <section className="py-24 bg-slate-900 border-t border-slate-800">
         <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">THE TECH STACK ADVANTAGE</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
               {[
                  { label: "Architecture", val: "Serverless", icon: Layers },
                  { label: "Security", val: "Enterprise Encrypted", icon: Shield },
                  { label: "AI Model", val: "GPT-4o + Claude 3.5", icon: Brain },
                  { label: "Telemetry", val: "Electron Engine", icon: Activity },
                  { label: "Search", val: "Vector RAG", icon: Search },
               ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center">
                     <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 border border-slate-700">
                        <item.icon className="w-8 h-8 text-slate-400" />
                     </div>
                     <h4 className="text-slate-500 text-sm uppercase tracking-wider mb-1">{item.label}</h4>
                     <p className="text-white font-semibold">{item.val}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* CTA Footer */}
      <section className="py-32 bg-slate-950 relative overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950"></div>
         <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">INITIALIZE SEQUENCE?</h2>
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
               Ready to upgrade your operating system? Join the future of work today.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
               <button className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] text-lg">
                  START DEPLOYMENT
               </button>
               <button className="px-10 py-5 bg-transparent border border-slate-700 hover:border-slate-500 text-slate-300 font-semibold rounded-xl transition-all text-lg">
                  VIEW DEMO
               </button>
            </div>
            <p className="mt-12 text-slate-600 font-mono text-sm">
               ShoreAgents OS v2.0 // Powering the Future of Work
            </p>
         </div>
      </section>
    </div>
  )
}

