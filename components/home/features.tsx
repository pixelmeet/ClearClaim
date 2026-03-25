"use client";
import { motion } from "framer-motion";
import { FEATURES_CONTENT } from "@/constants/home/features-constants";

export function Features() {
  const features = FEATURES_CONTENT.items.map((item) => {
    const Icon = item.icon;
    return {
      icon: <Icon />,
      title: item.title,
      description: item.description,
    };
  });

  return (
    <section className="py-20 px-4 bg-background font-sans" id={FEATURES_CONTENT.id}>
      <div className="container mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}>
          <span className="text-primary font-medium mb-2 inline-block font-sans">
            {FEATURES_CONTENT.eyebrow}
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
            {FEATURES_CONTENT.title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-sans">
            {FEATURES_CONTENT.description}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <motion.div
      className="bg-card/40 backdrop-blur-md rounded-2xl border border-card-border p-8 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="p-4 rounded-xl bg-primary/10 w-fit mb-6 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed font-sans">{description}</p>
      </div>
    </motion.div>
  );
}