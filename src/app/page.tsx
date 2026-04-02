import Link from "next/link";
import { Clock, Shield, Users, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button>
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container flex flex-col items-center gap-8 py-24 text-center">
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
          Time tracking that works.{" "}
          <span className="text-primary">Compliance built in.</span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          ClockFlow gives you complete control over employee time and attendance.
          From clock-ins to timesheets to leave management — all in one platform.
        </p>
        <div className="flex gap-4">
          <Link href="/sign-up">
            <Button size="lg">
              Start your free trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-24">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Everything you need to manage time
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={Clock}
              title="Smart Clockings"
              description="Clock in/out via kiosk, mobile, or web portal. GPS tracking and photo verification available."
            />
            <FeatureCard
              icon={Users}
              title="Employee Management"
              description="Manage departments, shift patterns, and employment details. Self-service portal for staff."
            />
            <FeatureCard
              icon={Shield}
              title="Compliance Ready"
              description="Full audit trail, overtime tracking, and Working Time Directive compliance built in."
            />
            <FeatureCard
              icon={BarChart3}
              title="Powerful Reports"
              description="Real-time dashboards, attendance reports, payroll exports, and custom report builder."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t py-8">
        <div className="container flex items-center justify-between">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Built by ClockFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
