"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="max-w-md space-y-6"
      >
        {/* Animated 404 with embedded icon */}
        <motion.div
          className="relative inline-block"
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 0.5,
          }}
        >
          <Compass className="absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-secondary opacity-30 md:h-24 md:w-24" />
          <h1 className="text-8xl font-bold font-serif text-primary md:text-9xl">
            404
          </h1>
        </motion.div>

        {/* Page Information */}
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
            Lost in Space?
          </h2>
          <p className="text-base text-muted-foreground md:text-lg">
            It seems the page you are looking for has ventured into the unknown.
          </p>
        </div>

        {/* Call to Action Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button
            asChild
            size="lg"
            className="mt-4 bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:bg-primary/90 hover:shadow-xl"
          >
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Return to Home Base
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}