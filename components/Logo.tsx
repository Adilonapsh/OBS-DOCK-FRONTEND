import Image from "next/image";


export default function Logo() {
  return (
     <Image src="/assets/logo/obs.png" alt="OBS" width={22} height={22} className="object-contain" />
  );
}
