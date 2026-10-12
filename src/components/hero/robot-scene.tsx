"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { useRef, useState, type RefObject } from "react";
import type { Group } from "three";
import { RobotFallback } from "./robot-fallback";

type Props = { active: boolean; compact: boolean; pointer: RefObject<{ x: number; y: number }> };
function Robot({ compact, pointer }: Omit<Props, "active">) {
  const group = useRef<Group>(null);
  const phase = useRef(0);
  useFrame((_, delta) => {
    if (!group.current) return;
    const step = Math.min(delta, 0.05);
    phase.current += step;
    group.current.position.y = Math.sin(phase.current * 0.8) * 0.06;
    const blend = 1 - Math.exp(-step * 3);
    group.current.rotation.y += (pointer.current.x * 0.15 + Math.sin(phase.current * 0.45) * 0.06 - group.current.rotation.y) * blend;
    group.current.rotation.x += (pointer.current.y * 0.06 - group.current.rotation.x) * blend;
  });
  const box = (position: [number, number, number], args: [number, number, number], color = "#516879") => <RoundedBox position={position} args={args} radius={0.12} smoothness={compact ? 1 : 3}><meshStandardMaterial color={color} roughness={0.32} metalness={0.45} /></RoundedBox>;
  return <group ref={group}>
    <mesh position={[0, -1.38, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[1.15, 0.018, 6, compact ? 32 : 64]} /><meshBasicMaterial color="#79e3de" transparent opacity={0.45} /></mesh>
    {box([0, 0.65, 0], [1.65, 1.1, 0.85])}
    {box([0, 0.65, 0.43], [1.36, 0.64, 0.12], "#090e17")}
    {[-0.37, 0.37].map((x) => <mesh key={x} position={[x, 0.69, 0.51]}><boxGeometry args={[0.24, 0.08, 0.025]} /><meshBasicMaterial color="#79e3de" /></mesh>)}
    <mesh position={[0, 0.43, 0.51]}><boxGeometry args={[0.28, 0.025, 0.025]} /><meshBasicMaterial color="#79e3de" /></mesh>
    {box([0, -0.5, 0], [1.1, 0.95, 0.7])}
    {[-0.78, 0.78].map((x) => <group key={x}>{box([x, -0.48, 0], [0.28, 0.7, 0.38])}</group>)}
    {[-0.3, 0.3].map((x) => <group key={x}>{box([x, -1.12, 0.12], [0.34, 0.28, 0.55])}</group>)}
    <mesh position={[0, -0.44, 0.37]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.1, 0.1, 0.025, compact ? 12 : 24]} /><meshBasicMaterial color="#79e3de" /></mesh>
    {!compact && <><mesh position={[0, 1.35, 0]}><cylinderGeometry args={[0.025, 0.025, 0.3, 8]} /><meshStandardMaterial color="#436071" /></mesh><mesh position={[0, 1.53, 0]}><sphereGeometry args={[0.07, 12, 8]} /><meshBasicMaterial color="#79e3de" /></mesh></>}
  </group>;
}
export default function RobotScene({ active, compact, pointer }: Props) {
  const [lost, setLost] = useState(false);
  if (lost) return <RobotFallback />;
  return <Canvas frameloop={active ? "always" : "never"} dpr={compact ? 1 : [1, 1.5]} camera={{ position: [2.4, 1.4, 6], fov: 36 }} gl={{ antialias: !compact, alpha: true, powerPreference: "low-power" }} fallback={<RobotFallback />} onCreated={({ gl }) => {
    gl.domElement.addEventListener("webglcontextlost", () => setLost(true), { once: true });
  }}><ambientLight intensity={1.5} /><directionalLight position={[3, 5, 4]} intensity={3} /><directionalLight position={[-4, 1, -2]} color="#79e3de" intensity={2} /><Robot compact={compact} pointer={pointer} /></Canvas>;
}
