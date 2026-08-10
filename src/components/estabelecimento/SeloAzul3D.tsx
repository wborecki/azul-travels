import { useRef, type PointerEvent } from "react";
import seloOficial from "@/assets/selo-turismo-azul.png";
import { cn } from "@/lib/utils";
import "./selo-3d.css";


const AMPLITUDE = 18;

interface SeloAzul3DProps {
  className?: string;
}

export function SeloAzul3D({ className }: SeloAzul3DProps) {
  const cartaRef = useRef<HTMLDivElement>(null);

  const aoMover = (ev: PointerEvent<HTMLDivElement>) => {
    const el = cartaRef.current;
    if (!el || ev.pointerType !== "mouse") return;

    const r = el.getBoundingClientRect();
    const px = (ev.clientX - r.left) / r.width;
    const py = (ev.clientY - r.top) / r.height;


    el.style.setProperty("--rx", `${(py - 0.5) * AMPLITUDE}deg`);
    el.style.setProperty("--ry", `${(0.5 - px) * AMPLITUDE * 2}deg`);

    el.style.setProperty("--sx", `${(0.5 - px) * 40}px`);


    const rad = Math.atan2(
      ev.clientY - (r.top + r.height / 2),
      ev.clientX - (r.left + r.width / 2),
    );
    const graus = (rad * 180) / Math.PI - 90;
    el.style.setProperty("--brilho-angulo", `${graus < 0 ? graus + 360 : graus}deg`);
    el.style.setProperty("--brilho-alpha", `${0.16 + py * 0.42}`);
  };

  const aoSair = () => {
    const el = cartaRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--sx", "0px");
    el.style.setProperty("--brilho-alpha", "0");
  };

  return (
    <div className={cn("selo3d-palco", className)} onPointerMove={aoMover} onPointerLeave={aoSair}>
      <div ref={cartaRef} className="selo3d-carta">
        <span aria-hidden className="selo3d-espessura" />
        <div className="selo3d-face">
          <img
            src={seloOficial}
            alt="Selo Turismo Azul - certificação oficial"
            className="block w-full select-none"
            draggable={false}
          />
          <span aria-hidden className="selo3d-brilho pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
