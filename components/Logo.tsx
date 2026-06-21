import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
  rounded?: boolean;
  bg?: string;
}

/**
 * Cherry Pick brand logo. Single source of truth — swap LOGO_SRC here to
 * change the logo platform-wide.
 */
export const LOGO_SRC = "/logo-new.png";

export default function Logo({ size = 32, className = "", rounded = true, bg = "#FFF" }: LogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Cherry Pick"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? "50%" : 0,
        background: bg,
        objectFit: "contain",
        padding: Math.max(2, Math.floor(size * 0.08)),
      }}
      className={className}
      priority
    />
  );
}
