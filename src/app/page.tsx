"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock,
  Users,
  BarChart3,
  FileText,
  Calendar,
  Monitor,
  ArrowRight,
  Check,
  Star,
  Shield,
  Zap,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">ClockWise</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Pricing
            </a>
            <a href="#demo" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Demo
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0F0F1A] via-[#1a1a2e] to-[#16213e] py-28 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="flex flex-col items-center gap-6"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
                <Star className="h-3.5 w-3.5" />
                Trusted by 500+ UK businesses
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="max-w-4xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl"
            >
              The smarter way to manage{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                time &amp; attendance
              </span>
            </motion.h1>
            <motion.p variants={fadeUp} className="max-w-xl text-lg text-slate-300">
              Streamline clocking, timesheets, absence, and payroll in one
              powerful platform built for UK businesses.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 text-base">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20 px-8 py-3 text-base"
                >
                  Watch Demo
                </Button>
              </a>
            </motion.div>

            {/* Dashboard mockup */}
            <motion.div variants={fadeUp} className="mt-12 w-full max-w-5xl" id="demo">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl shadow-black/40">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                  <div className="ml-4 flex-1 rounded-md bg-white/5 px-3 py-1 text-xs text-slate-400">
                    app.clockwise.io/dashboard
                  </div>
                </div>
                <div className="flex h-72 gap-0">
                  <div className="w-48 border-r border-white/5 bg-[#1E1E2E] p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-6 w-6 rounded bg-indigo-500 flex items-center justify-center">
                        <Clock className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-white">ClockWise</span>
                    </div>
                    {["Dashboard", "Employees", "Timesheets", "Absence", "Reports"].map((item, i) => (
                      <div
                        key={item}
                        className={`rounded-lg px-3 py-2 text-xs ${i === 0 ? "bg-indigo-500/20 text-indigo-300" : "text-slate-400"}`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 p-6">
                    <div className="mb-4 text-sm font-semibold text-white">Dashboard</div>
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {[
                        { label: "Total Staff", value: "48", textColor: "text-indigo-300" },
                        { label: "Clocked In", value: "32", textColor: "text-green-300" },
                        { label: "Absent", value: "3", textColor: "text-red-300" },
                        { label: "Pending", value: "5", textColor: "text-amber-300" },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-xl bg-white/5 p-3">
                          <div className="text-xs text-slate-400">{stat.label}</div>
                          <div className={`text-2xl font-bold mt-1 ${stat.textColor}`}>{stat.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl bg-white/5 p-3">
                      <div className="text-xs text-slate-400 mb-2">Weekly Hours</div>
                      <div className="flex items-end gap-2 h-12">
                        {[60, 80, 75, 90, 70, 40, 20].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t bg-indigo-500/60" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                      <div className="flex justify-between mt-1">
                        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                          <div key={i} className="flex-1 text-center text-[10px] text-slate-500">{d}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-b border-slate-100 bg-slate-50 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-sm font-medium text-slate-500 mb-6">
            TRUSTED BY 500+ UK BUSINESSES
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12">
            {["Retail Co.", "BuildTech Ltd", "CareFirst", "LogiMove", "FreshMart"].map((company) => (
              <span key={company} className="text-lg font-semibold text-slate-300">
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-4xl font-bold text-slate-900">
              Everything you need in one place
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
              From clock-in to payroll export, ClockWise handles every step of your workforce management.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {[
              {
                icon: Clock,
                title: "Clock In / Out",
                description: "Hardware terminals, web portal, or mobile app. GPS verified, tamper-proof records.",
                iconClass: "bg-indigo-50 text-indigo-500",
              },
              {
                icon: FileText,
                title: "Timesheets",
                description: "Automated weekly timesheets with scheduled vs actual comparison and payroll export.",
                iconClass: "bg-purple-50 text-purple-500",
              },
              {
                icon: Calendar,
                title: "Leave Management",
                description: "Manage annual leave, sick days and bank holidays. Approval workflows built in.",
                iconClass: "bg-green-50 text-green-500",
              },
              {
                icon: Users,
                title: "Scheduling",
                description: "Create shift patterns, assign to employees, and manage rotations effortlessly.",
                iconClass: "bg-blue-50 text-blue-500",
              },
              {
                icon: BarChart3,
                title: "Reports",
                description: "Payroll reports, attendance analytics, late arrival tracking, and custom exports.",
                iconClass: "bg-amber-50 text-amber-500",
              },
              {
                icon: Monitor,
                title: "Hardware Terminals",
                description: "Biometric and RFID terminals with offline sync. Enterprise-grade hardware.",
                iconClass: "bg-rose-50 text-rose-500",
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                className="group rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.iconClass}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-slate-500">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-4xl font-bold text-slate-900">
              Simple, transparent pricing
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-lg text-slate-500">
              Pay per employee. No hidden fees. Cancel any time.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto"
          >
            {[
              {
                name: "Starter",
                price: "£5",
                per: "per user / month",
                description: "Perfect for small teams up to 25 employees.",
                features: [
                  "Clock in/out (web + mobile)",
                  "Weekly timesheets",
                  "Leave management",
                  "5 report templates",
                  "Email support",
                ],
                cta: "Start free trial",
                highlight: false,
              },
              {
                name: "Growth",
                price: "£8",
                per: "per user / month",
                description: "For growing businesses needing more power.",
                features: [
                  "Everything in Starter",
                  "Hardware terminal support",
                  "Shift scheduling",
                  "Custom reports",
                  "Priority support",
                  "API access",
                ],
                cta: "Start free trial",
                highlight: true,
              },
              {
                name: "Scale",
                price: "£6",
                per: "per user / month",
                description: "Best value for 71+ employees.",
                features: [
                  "Everything in Growth",
                  "Volume discount (71+ users)",
                  "Dedicated account manager",
                  "SSO / SAML",
                  "Custom integrations",
                  "SLA guarantee",
                ],
                cta: "Contact sales",
                highlight: false,
              },
            ].map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                className={`relative rounded-2xl p-8 ${
                  plan.highlight
                    ? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/30 scale-105"
                    : "bg-white border border-slate-200"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-amber-400 px-4 py-1 text-xs font-bold text-amber-900">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={`text-lg font-bold ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                    {plan.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.highlight ? "text-indigo-200" : "text-slate-500"}`}>
                      {plan.per}
                    </span>
                  </div>
                  <p className={`mt-2 text-sm ${plan.highlight ? "text-indigo-200" : "text-slate-500"}`}>
                    {plan.description}
                  </p>
                </div>
                <ul className="mb-8 flex flex-col gap-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 flex-shrink-0 ${plan.highlight ? "text-indigo-200" : "text-indigo-500"}`} />
                      <span className={plan.highlight ? "text-indigo-100" : "text-slate-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
                  <Button
                    className={`w-full ${
                      plan.highlight
                        ? "bg-white text-indigo-600 hover:bg-indigo-50"
                        : "bg-indigo-500 text-white hover:bg-indigo-600"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-y border-slate-100 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-center justify-center gap-12">
            {[
              { icon: Shield, text: "SOC 2 Compliant" },
              { icon: Globe, text: "GDPR Ready" },
              { icon: Zap, text: "99.9% Uptime SLA" },
              { icon: Star, text: "4.9/5 from 200+ reviews" },
            ].map((badge) => (
              <div key={badge.text} className="flex items-center gap-2 text-slate-500">
                <badge.icon className="h-5 w-5 text-indigo-500" />
                <span className="text-sm font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#0F0F1A] to-[#1a1a2e] py-24 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold">
              Ready to streamline your workforce?
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-lg text-slate-300">
              Start your 14-day free trial today. No credit card required.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="bg-indigo-500 hover:bg-indigo-600 text-white px-10 py-3 text-base">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20 px-10 py-3 text-base"
                >
                  Sign in
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">ClockWise</span>
            </div>
            <div className="flex gap-8">
              <a href="#features" className="text-sm text-slate-500 hover:text-slate-900">Features</a>
              <a href="#pricing" className="text-sm text-slate-500 hover:text-slate-900">Pricing</a>
              <Link href="/sign-in" className="text-sm text-slate-500 hover:text-slate-900">Sign In</Link>
              <Link href="/sign-up" className="text-sm text-slate-500 hover:text-slate-900">Sign Up</Link>
            </div>
            <p className="text-sm text-slate-400">© 2026 ClockWise. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
