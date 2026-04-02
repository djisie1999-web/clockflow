"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Building2, UserPlus, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const companySchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  phone: z.string().optional(),
  timezone: z.string().default("Europe/London"),
});

const employeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

type CompanyData = z.infer<typeof companySchema>;
type EmployeeData = z.infer<typeof employeeSchema>;

const steps = [
  { id: 1, label: "Company", icon: Building2 },
  { id: 2, label: "First Employee", icon: UserPlus },
  { id: 3, label: "Ready!", icon: Sparkles },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);

  const companyForm = useForm<CompanyData>({ resolver: zodResolver(companySchema) });
  const employeeForm = useForm<EmployeeData>({ resolver: zodResolver(employeeSchema) });

  async function onCompanySubmit(data: CompanyData) {
    setLoading(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: data.name, phone: data.phone, address: data.address }),
      });
      setCompanyData(data);
      setStep(2);
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
    }
  }

  async function onEmployeeSubmit(data: EmployeeData) {
    setLoading(true);
    try {
      await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          hireDate: new Date().toISOString(),
          employmentType: "FULL_TIME",
        }),
      });
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
      setStep(3);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      {/* Header */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500">
          <Clock className="h-5 w-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-slate-900">ClockWise</span>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-4">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  step > s.id
                    ? "border-indigo-500 bg-indigo-500 text-white"
                    : step === s.id
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                    : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                {step > s.id ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              <span className={`text-xs font-medium ${step === s.id ? "text-indigo-600" : "text-slate-400"}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mb-5 h-0.5 w-16 ${step > s.id ? "bg-indigo-500" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <h2 className="text-xl font-bold text-slate-900">Company details</h2>
            <p className="mt-1 text-sm text-slate-500">Tell us about your business.</p>
            <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Company name *</Label>
                <Input {...companyForm.register("name")} placeholder="Acme Ltd" />
                {companyForm.formState.errors.name && (
                  <p className="text-xs text-red-500">{companyForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input {...companyForm.register("address")} placeholder="123 Main Street, London" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input {...companyForm.register("phone")} placeholder="+44 20 7123 4567" />
              </div>
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <select
                  {...companyForm.register("timezone")}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Europe/Dublin">Europe/Dublin</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                </select>
              </div>
              <Button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600" disabled={loading}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <h2 className="text-xl font-bold text-slate-900">Add your first employee</h2>
            <p className="mt-1 text-sm text-slate-500">You can add more employees later.</p>
            <form onSubmit={employeeForm.handleSubmit(onEmployeeSubmit)} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First name *</Label>
                  <Input {...employeeForm.register("firstName")} placeholder="Jane" />
                  {employeeForm.formState.errors.firstName && (
                    <p className="text-xs text-red-500">{employeeForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Last name *</Label>
                  <Input {...employeeForm.register("lastName")} placeholder="Smith" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input {...employeeForm.register("email")} type="email" placeholder="jane@company.com" />
                {employeeForm.formState.errors.email && (
                  <p className="text-xs text-red-500">{employeeForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(3)}
                >
                  Skip for now
                </Button>
                <Button type="submit" className="flex-1 bg-indigo-500 hover:bg-indigo-600" disabled={loading}>
                  Add employee <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">You&apos;re all set!</h2>
            <p className="mt-2 text-slate-500">
              {companyData?.name ?? "Your company"} is ready to go. Head to your dashboard to start tracking time.
            </p>
            <div className="mt-6 space-y-3">
              <Link href="/dashboard">
                <Button className="w-full bg-indigo-500 hover:bg-indigo-600">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/employees">
                <Button variant="outline" className="w-full">
                  Add more employees
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
