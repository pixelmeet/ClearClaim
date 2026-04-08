"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function CTA() {
  return (
    <section className="py-24 md:py-32 px-4 relative overflow-hidden">
      {/* Glowing background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[200px]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[250px] h-[250px] bg-success/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto relative z-10">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel-strong text-sm text-primary font-medium mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Sparkles className="h-4 w-4" />
            Ready to get started?
          </motion.div>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
            Start controlling your{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              company spend
            </span>{" "}
            today
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Join hundreds of finance teams that have eliminated expense chaos with ClearClaim.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary-hover text-white text-base py-6 px-10 font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02] group"
              asChild
            >
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border text-foreground hover:bg-glass-bg backdrop-blur-sm text-base py-6 px-10 font-semibold rounded-xl transition-all duration-300"
              asChild
            >
              <Link href="#features">
                Schedule Demo
              </Link>
            </Button>
          </div>

          {/* Social proof */}
          <motion.div
            className="mt-12 flex items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex -space-x-2">
              {[
                "bg-gradient-to-br from-primary to-accent",
                "bg-gradient-to-br from-accent to-pink-500",
                "bg-gradient-to-br from-success to-emerald-400",
                "bg-gradient-to-br from-warning to-orange-400",
              ].map((bg, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-background flex items-center justify-center text-[10px] font-bold text-white`}>
                  {["JD", "SC", "MJ", "LW"][i]}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">500+</span> teams already onboard
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
