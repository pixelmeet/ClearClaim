"use client";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { TESTIMONIALS_CONTENT } from "@/constants/home/testimonials-constants";
import { useState, useEffect, useCallback } from "react";

export function Testimonials() {
  const testimonials = TESTIMONIALS_CONTENT.items;
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [autoPlay, next]);

  return (
    <section className="py-28 md:py-36 px-4 relative overflow-hidden" id={TESTIMONIALS_CONTENT.id}>
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-accent/5 rounded-full blur-[180px]" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-sm text-primary font-medium mb-5">
            {TESTIMONIALS_CONTENT.eyebrow}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-5">
            Trusted by{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              finance leaders
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {TESTIMONIALS_CONTENT.description}
          </p>
        </motion.div>

        {/* Rating Summary */}
        <motion.div
          className="flex justify-center mb-14"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full glass-panel-strong">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-warning fill-warning" />
              ))}
            </div>
            <span className="text-sm font-medium text-foreground">4.9/5</span>
            <span className="text-border">|</span>
            <span className="text-sm text-muted-foreground">from 500+ finance teams</span>
          </div>
        </motion.div>

        {/* Featured Testimonial Card */}
        <div className="max-w-4xl mx-auto mb-12">
          <div
            className="relative"
            onMouseEnter={() => setAutoPlay(false)}
            onMouseLeave={() => setAutoPlay(true)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="glass-panel-strong rounded-3xl p-8 md:p-12 relative overflow-hidden"
              >
                {/* Large quote mark */}
                <Quote className="h-16 w-16 text-primary/10 absolute top-6 right-8" />

                <div className="relative z-10">
                  {/* Stars */}
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-warning fill-warning" />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-xl md:text-2xl text-foreground/90 leading-relaxed font-display mb-8 max-w-3xl">
                    &ldquo;{testimonials[activeIndex].content}&rdquo;
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                        <Image
                          src={testimonials[activeIndex].avatar}
                          alt={testimonials[activeIndex].author}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-foreground font-display">
                          {testimonials[activeIndex].author}
                        </h4>
                        <p className="text-primary text-sm font-medium">
                          {testimonials[activeIndex].role}
                        </p>
                      </div>
                    </div>

                    {/* Impact metric */}
                    <div className="glass-panel rounded-xl px-5 py-3">
                      <div className="text-xs text-muted-foreground mb-0.5">Impact</div>
                      <div className="text-sm font-bold text-foreground">
                        {testimonials[activeIndex].metric}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation arrows */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={prev}
                className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-muted-foreground hover:text-primary hover:glow-primary transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === activeIndex
                        ? "w-8 bg-primary"
                        : "w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-muted-foreground hover:text-primary hover:glow-primary transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Small Testimonial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className={`glass-panel rounded-2xl p-6 cursor-pointer transition-all duration-500 ${
                index === activeIndex
                  ? "ring-1 ring-primary/30 glow-primary"
                  : "hover:ring-1 hover:ring-border/30"
              }`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              onClick={() => setActiveIndex(index)}
              whileHover={{ y: -4 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/10">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground font-display">
                    {testimonial.author}
                  </h4>
                  <p className="text-primary text-xs">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">
                &ldquo;{testimonial.content}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
