import { Button } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Shop Quality Products Online",
  path: "/",
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">__PROJECT_TITLE__ — scaffold placeholder</h1>
      <Button>Homepage design goes here</Button>
    </main>
  );
}
