import Marketplace from "@/components/Marketplace";
import Providers from "@/components/Providers";

export const dynamic = 'force-dynamic';

export default function MarketplacePage() {
  return (
    <Providers>
      <Marketplace />
    </Providers>
  );
}
