"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FadeIn } from '@/components/animated/FadeIn';
import { StaggerChildren, StaggerItem } from '@/components/animated/StaggerChildren';
import { GlowCard } from '@/components/animated/GlowCard';
import { FloatingElement } from '@/components/animated/FloatingElement';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Eye, 
  Zap, 
  Network, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  Users,
  Code,
  Building2,
  Sparkles,
  GitBranch,
  Play,
  FileText,
  Swords
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden bg-linear-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <FloatingElement delay={0} duration={4} className="absolute top-20 left-10">
            <div className="w-72 h-72 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl" />
          </FloatingElement>
          <FloatingElement delay={1} duration={5} className="absolute top-40 right-10">
            <div className="w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
          </FloatingElement>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <FadeIn direction="down" duration={0.8}>
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-8"
              >
                <Sparkles className="w-4 h-4" />
                AI Agent Testing Platform
              </motion.div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} duration={0.8}>
            <h1 className="text-6xl md:text-7xl font-bold text-center mb-6 bg-clip-text text-transparent bg-linear-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-zinc-50 dark:via-zinc-200 dark:to-zinc-50">
              Deploy Agentic AI
              <br />
              <span className="gradient-text">Safely & Confidently</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.4} duration={0.8}>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 text-center max-w-3xl mx-auto mb-10">
              Testing AI agents today is slow, opaque, and inaccessible. FlowLens enables companies to deploy agentic AI safely, responsibly, and with confidence.
            </p>
          </FadeIn>

          <FadeIn delay={0.6} duration={0.8}>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/test">
                <Button size="lg" className="text-base px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all">
                  Start Testing
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/attack">
                <Button size="lg" variant="outline" className="text-base px-8 py-6 rounded-xl">
                  Try Attack Mode
                  <Swords className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
              Built for Every Team
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 text-center max-w-2xl mx-auto mb-16">
              From non-technical testers to senior engineers, FlowLens makes AI agent testing accessible and powerful.
            </p>
          </FadeIn>

          <StaggerChildren staggerDelay={0.15}>
            <div className="grid md:grid-cols-3 gap-8">
              <StaggerItem>
                <GlowCard glowColor="rgba(99, 102, 241, 0.3)">
                  <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl w-fit mb-6">
                    <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">For Non-Technical Teams</h3>
                  <ul className="space-y-3 text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <span>Understand the agent visually</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <span>Test safety & compliance without touching code</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <span>Collaborate with engineers more effectively</span>
                    </li>
                  </ul>
                </GlowCard>
              </StaggerItem>

              <StaggerItem>
                <GlowCard glowColor="rgba(139, 92, 246, 0.3)">
                  <div className="p-4 bg-violet-100 dark:bg-violet-900/30 rounded-xl w-fit mb-6">
                    <Code className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">For Engineers</h3>
                  <ul className="space-y-3 text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <span>Faster debugging and incident reproduction</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <span>Automated multi-run traces</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <span>Clear visibility into agent internals and tool calls</span>
                    </li>
                  </ul>
                </GlowCard>
              </StaggerItem>

              <StaggerItem>
                <GlowCard glowColor="rgba(168, 85, 247, 0.3)">
                  <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl w-fit mb-6">
                    <Building2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">For Organizations</h3>
                  <ul className="space-y-3 text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <span>Reduces deployment risks</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <span>Accelerates productionization</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <span>Ensures safety, reliability, and transparency</span>
                    </li>
                  </ul>
                </GlowCard>
              </StaggerItem>
            </div>
          </StaggerChildren>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 text-center max-w-2xl mx-auto mb-16">
              Everything you need to test, debug, and secure your AI agents.
            </p>
          </FadeIn>

          <div className="space-y-24">
            {/* Feature 1 */}
            <FadeIn direction="left">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4">
                    <GitBranch className="w-4 h-4" />
                    Visualization
                  </div>
                  <h3 className="text-3xl font-bold mb-4">
                    Automatic Code-to-Graph Visualization
                  </h3>
                  <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
                    Turn any agent's code into an interactive graph that shows its reasoning flow, memory updates, and tool usage — no technical setup required.
                  </p>
                  <Link href="/test">
                    <Button variant="outline" className="rounded-xl">
                      View Test Editor
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="relative"
                >
                  <div className="aspect-video rounded-2xl bg-linear-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 border border-zinc-200 dark:border-zinc-800 p-8 flex items-center justify-center">
                    <Network className="w-32 h-32 text-blue-500 dark:text-blue-400" />
                  </div>
                </motion.div>
              </div>
            </FadeIn>

            {/* Feature 2 */}
            <FadeIn direction="right">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="relative order-2 md:order-1"
                >
                  <div className="aspect-video rounded-2xl bg-linear-to-br from-red-500/10 to-orange-500/10 dark:from-red-500/20 dark:to-orange-500/20 border border-zinc-200 dark:border-zinc-800 p-8 flex items-center justify-center">
                    <Target className="w-32 h-32 text-red-500 dark:text-red-400" />
                  </div>
                </motion.div>
                <div className="order-1 md:order-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-medium mb-4">
                    <Swords className="w-4 h-4" />
                    Red Teaming
                  </div>
                  <h3 className="text-3xl font-bold mb-4">
                    Drag-and-Drop Red-Team Test Nodes
                  </h3>
                  <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
                    Non-technical users can simulate adversarial prompts, social engineering, tool misuse, or multi-turn exploits with a simple UI.
                  </p>
                  <Link href="/attack">
                    <Button variant="outline" className="rounded-xl">
                      Try Attack Mode
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </FadeIn>

            {/* Feature 3 */}
            <FadeIn direction="left">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium mb-4">
                    <Play className="w-4 h-4" />
                    Real-Time
                  </div>
                  <h3 className="text-3xl font-bold mb-4">
                    Real-Time Execution Tracing & Alerting
                  </h3>
                  <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
                    Instantly see where the agent makes mistakes, violates policy, or leaks information.
                  </p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <Eye className="w-4 h-4" />
                      Live Monitoring
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <AlertTriangle className="w-4 h-4" />
                      Instant Alerts
                    </div>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="relative"
                >
                  <div className="aspect-video rounded-2xl bg-linear-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border border-zinc-200 dark:border-zinc-800 p-8 flex items-center justify-center">
                    <Zap className="w-32 h-32 text-green-500 dark:text-green-400" />
                  </div>
                </motion.div>
              </div>
            </FadeIn>

            {/* Feature 4 */}
            <FadeIn direction="right">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="relative order-2 md:order-1"
                >
                  <div className="aspect-video rounded-2xl bg-linear-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 border border-zinc-200 dark:border-zinc-800 p-8 flex items-center justify-center">
                    <FileText className="w-32 h-32 text-purple-500 dark:text-purple-400" />
                  </div>
                </motion.div>
                <div className="order-1 md:order-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-4">
                    <Shield className="w-4 h-4" />
                    Reporting
                  </div>
                  <h3 className="text-3xl font-bold mb-4">
                    Automated Vulnerability Reports
                  </h3>
                  <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
                    The system generates reproducible logs, severity scores, and recommended fixes automatically.
                  </p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <FileText className="w-4 h-4" />
                      Detailed Logs
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <Shield className="w-4 h-4" />
                      Security Scores
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Attack Mode Section */}
      <section className="py-20 px-6 bg-linear-to-b from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", duration: 0.8 }}
                className="inline-flex p-4 bg-red-100 dark:bg-red-900/30 rounded-2xl mb-6"
              >
                <Swords className="w-12 h-12 text-red-600 dark:text-red-400" />
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Introducing Attack Mode
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                Deploy autonomous attack agents that continuously probe your AI systems for vulnerabilities, simulating real-world adversarial scenarios.
              </p>
            </div>
          </FadeIn>

          <StaggerChildren staggerDelay={0.1}>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <StaggerItem>
                <Card className="border-red-200 dark:border-red-900/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-red-600 dark:text-red-400" />
                      Autonomous Testing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Attack agents run independently, exploring edge cases and vulnerabilities without manual intervention.
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="border-orange-200 dark:border-orange-900/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      Real-World Scenarios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Simulate prompt injection, jailbreaks, data extraction, and other sophisticated attack vectors.
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="border-red-200 dark:border-red-900/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                      Continuous Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Run attack agents on schedule or integrate them into your CI/CD pipeline for ongoing protection.
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>

              <StaggerItem>
                <Card className="border-orange-200 dark:border-orange-900/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      Actionable Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Get detailed findings with severity ratings, reproduction steps, and remediation recommendations.
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            </div>
          </StaggerChildren>

          <FadeIn delay={0.3}>
            <div className="text-center">
              <Link href="/attack">
                <Button size="lg" className="text-base px-8 py-6 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg">
                  Launch Attack Mode
                  <Swords className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-linear-to-br from-violet-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Secure Your AI Agents?
            </h2>
            <p className="text-xl text-violet-100 mb-10 max-w-2xl mx-auto">
              Join teams building safer, more reliable agentic AI systems with FlowLens.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/test">
                <Button size="lg" variant="secondary" className="text-base px-8 py-6 rounded-xl">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
