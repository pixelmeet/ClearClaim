"use client";
import { motion } from "framer-motion";

const logos = [
  "Acme Corp",
  "Globex",
  "Initech",
  "Umbrella",
  "Stark Industries",
  "Wayne Enterprises",
  "Cyberdyne",
  "Aperture",
];

export function TrustLogos() {
  return (
    <section className="py-16 px-4 relative overflow-hidden">
      <div className="container mx-auto">
        <motion.p
          className="text-center text-sm font-medium text-muted-foreground mb-10 tracking-wide uppercase"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Trusted by finance teams at leading companies
        </motion.p>

        <motion.div
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.08 }}
        >
          {logos.map((name, i) => (
            <motion.div
              key={name}
              className="text-lg md:text-xl font-bold text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors duration-500 cursor-default select-none font-display tracking-tight"
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              {name}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
