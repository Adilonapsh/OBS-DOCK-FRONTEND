import Image from "next/image";


export default function Logo({ size = 22, className = "object-contain" }: { size?: number; className?: string }) {
  return (
     <Image src="/assets/logo/obs.png" alt="OBS" width={size} height={size} className={className} />
  );
}
