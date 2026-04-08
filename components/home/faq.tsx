"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { FAQ_CONTENT } from "@/constants/home/faq-constants";

export function FAQ() {
  const faqs = FAQ_CONTENT.items;

  return (
    <section className="py-24 md:py-32 px-4 relative overflow-hidden" id={FAQ_CONTENT.id}>
      <div className="container mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-sm text-primary font-medium mb-4">
            {FAQ_CONTENT.eyebrow}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-5">
            {FAQ_CONTENT.title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {FAQ_CONTENT.description}
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                viewport={{ once: true }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="glass-panel rounded-xl overflow-hidden border-0"
                >
                  <AccordionTrigger className="px-6 py-4 hover:bg-primary/5 text-left font-display font-medium text-foreground data-[state=open]:text-primary transition-all text-sm md:text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-1 text-muted-foreground text-sm leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
