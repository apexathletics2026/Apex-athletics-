"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

export function Hero() {
  return (
    <div className="relative max-w-6xl mx-auto px-5 pb-16 w-full text-white">
      <div className="absolute -top-10 right-0 w-full max-w-md h-[420px] pointer-events-none opacity-90 hidden md:block">
        <HeroScene />
      </div>
      <span className="bib text-white border-white hero-fade inline-block" style={{ animationDelay: "0.1s" }}>
        №001
      </span>
      <h1 className="font-black text-4xl md:text-6xl leading-[0.95] mt-4 mb-4 tracking-tight">
        <span className="block hero-fade" style={{ animationDelay: "0.25s" }}>EVERY FINISH</span>
        <span className="block hero-fade" style={{ animationDelay: "0.4s" }}>LINE STARTS</span>
        <span className="block hero-fade text-accentDark" style={{ animationDelay: "0.55s" }}>WITH A BIB.</span>
      </h1>
      <p className="max-w-md text-white/75 mb-7 hero-fade" style={{ animationDelay: "0.7s" }}>
        Apex Athletics organizes marathons, running, fitness and adventure events. Register, train, and cross your next finish line with us.
      </p>
      <div className="flex flex-wrap gap-3 hero-fade" style={{ animationDelay: "0.85s" }}>
        <Link href="/events" className="btn btn-primary">
          Explore Events <ArrowRight size={15} />
        </Link>
        <Link href="/events" className="btn btn-outline !border-white !text-white">
          Register Now
        </Link>
      </div>
    </div>
  );
}

export function RunningMarquee() {
  const strip = "RUN  ·  TRAIN  ·  FINISH  ·  REPEAT  ·  ";
  const content = strip.repeat(6);
  return (
    <div className="overflow-hidden bg-accentDark py-3">
      <div className="marquee-track flex whitespace-nowrap">
        <span className="text-white font-black text-sm tracking-widest uppercase px-2">{content}</span>
        <span className="text-white font-black text-sm tracking-widest uppercase px-2" aria-hidden="true">{content}</span>
      </div>
    </div>
  );
}

export function CountUp({ value, suffix = "" }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !value) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const duration = 1200;
          const startTime = performance.now();
          function tick(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            setDisplay(Math.floor(progress * value));
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
          obs.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

export function Reveal({ children, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${className} reveal ${visible ? "reveal-visible" : ""}`}>
      {children}
    </div>
  );
          }
