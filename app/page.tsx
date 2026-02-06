"use client";

import Link from "next/link";
import { ArrowRight, Zap, Shield, Code, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-animated opacity-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_var(--gradient-primary-start)_0%,_transparent_50%)] opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_var(--gradient-secondary-start)_0%,_transparent_50%)] opacity-20" />

      {/* Navigation */}
      <nav className="relative z-10 glass border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-bold text-gradient-primary">
                Base Template
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-primary hover-glow-primary">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block"
            >
              <div className="glass-subtle rounded-full px-4 py-2 border inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Production-Ready Full Stack Template
                </span>
              </div>
            </motion.div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Build Modern Apps{" "}
              <span className="text-gradient-primary">Lightning Fast</span>
            </h1>

            {/* Description */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive, production-ready base template with Next.js and
              NestJS. Beautiful UI components, authentication, and everything
              you need to start building.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/dashboard/overview">
                <Button size="lg" className="bg-gradient-primary hover-glow-primary shine">
                  View Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/ui-showcase">
                <Button size="lg" variant="outline" className="glass-subtle">
                  Explore Components
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Image/Glass Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20"
          >
            <div className="glass gradient-border rounded-2xl p-2">
              <div className="bg-card rounded-xl p-8 aspect-video flex items-center justify-center">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="h-16 w-16 rounded-xl bg-gradient-primary flex items-center justify-center">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-sm font-medium">Fast</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="h-16 w-16 rounded-xl bg-gradient-secondary flex items-center justify-center">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-sm font-medium">Secure</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="h-16 w-16 rounded-xl bg-gradient-accent flex items-center justify-center">
                      <Code className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-sm font-medium">Modern</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="h-16 w-16 rounded-xl bg-gradient-primary flex items-center justify-center pulse-glow">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-sm font-medium">Beautiful</span>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground">
              Pre-built components and patterns for rapid development
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                whileHover={{ y: -5 }}
                className="glass rounded-xl p-6 hover-glow-primary"
              >
                <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    title: "Modern UI Components",
    description:
      "Beautiful, accessible components built with shadcn/ui and Tailwind CSS",
    icon: Code,
  },
  {
    title: "Authentication Ready",
    description:
      "Complete auth system with JWT, social login, and password reset",
    icon: Shield,
  },
  {
    title: "Real-time Updates",
    description: "WebSocket integration for live notifications and updates",
    icon: Zap,
  },
  {
    title: "CRUD Examples",
    description:
      "Complete examples of listing, creating, editing, and deleting data",
    icon: Code,
  },
  {
    title: "File Management",
    description: "Upload, preview, and manage files with drag-and-drop support",
    icon: Code,
  },
  {
    title: "Charts & Visualizations",
    description: "Beautiful charts and data visualization components",
    icon: Code,
  },
];
