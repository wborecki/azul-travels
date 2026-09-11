import { useEffect, useState } from "react";

export function useMediaQuery(consulta: string): boolean {
  const [combina, setCombina] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(consulta);
    const aoMudar = () => setCombina(mql.matches);
    aoMudar();
    mql.addEventListener("change", aoMudar);
    return () => mql.removeEventListener("change", aoMudar);
  }, [consulta]);

  return combina;
}
