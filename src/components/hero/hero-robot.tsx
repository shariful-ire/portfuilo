"use client";

import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { RobotFallback } from "./robot-fallback";

// No Three/Fiber/Drei import is evaluated until this island is visible and motion is allowed.
const RobotScene = lazy(() => import("./robot-scene"));
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <RobotFallback /> : this.props.children; }
}

export function HeroRobot({ enabled = true }: { enabled?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [compact, setCompact] = useState(true);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = matchMedia("(max-width: 767px), (pointer: coarse)");
    const update = () => { setReduced(motion.matches); setCompact(mobile.matches); if (mobile.matches) pointer.current = { x: 0, y: 0 }; };
    const visibility = () => setVisible(document.visibilityState === "visible");
    update(); visibility();
    motion.addEventListener("change", update); mobile.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    if (host.current) observer.observe(host.current);
    return () => { observer.disconnect(); motion.removeEventListener("change", update); mobile.removeEventListener("change", update); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  useEffect(() => {
    if (!enabled || reduced || !inView || !visible || loaded) return;
    const timer = setTimeout(() => setLoaded(true), 200);
    return () => clearTimeout(timer);
  }, [enabled, reduced, inView, visible, loaded]);
  return <div ref={host} aria-hidden="true" className="relative mx-auto h-64 w-full max-w-md sm:h-80 lg:h-[420px]" onPointerMove={(event) => {
    if (!enabled || compact || reduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointer.current = { x: (event.clientX - rect.left) / rect.width * 2 - 1, y: (event.clientY - rect.top) / rect.height * 2 - 1 };
  }} onPointerLeave={() => { pointer.current = { x: 0, y: 0 }; }}>
    <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(ellipse,#16363c66,transparent_65%)]" />
    <div className="pointer-events-none relative h-full">
      {enabled && loaded && !reduced ? <SceneBoundary><Suspense fallback={<RobotFallback />}><RobotScene active={visible && inView} compact={compact} pointer={pointer} /></Suspense></SceneBoundary> : <RobotFallback />}
    </div>
  </div>;
}
