"use client";

import { useInView } from "react-intersection-observer";
import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    id: "item-1",
    question: "Is SyllabAI free to use?",
    answer:
      "Yes! SyllabAI offers a free Basic tier that lets you generate structured courses, read lesson texts, take chapter quizzes, and study with our voice AI tutor. You can also upgrade to Pro for unlimited course generation.",
  },
  {
    id: "item-2",
    question: "What topics can I generate courses for?",
    answer:
      "You can generate a curriculum for virtually any subject — including software engineering, data science, mathematics, history, literature, medicine, or business management.",
  },
  {
    id: "item-3",
    question: "How does the Voice AI Tutor work?",
    answer:
      "Stuck on a lesson or concept? Click the Study Buddy button to speak with your voice-enabled AI tutor. It reads the current lesson context to explain difficult points hands-free.",
  },
  {
    id: "item-4",
    question: "Can I print or export my generated courses?",
    answer:
      "Yes! Every course includes a print-friendly view option, allowing you to save your entire structured curriculum or individual lesson chapters as clean PDFs.",
  },
  {
    id: "item-5",
    question: "Is my study progress and quiz history saved?",
    answer:
      "All your quiz completion scores, finished chapters, and study streak statistics are securely stored in your personal account database.",
  },
];

export default function FAQSection() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  return (
    <section id="faq" className="w-full max-w-4xl px-6 py-24 border-t border-border/60">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        className="space-y-12"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 px-3.5 py-1 text-xs font-semibold bg-primary/10 text-primary uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">
            Got Questions? We've Got Answers.
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto text-balance">
            Everything you need to know about course generation and voice tutoring.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-lg">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="border-border/60">
                <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </motion.div>
    </section>
  );
}
