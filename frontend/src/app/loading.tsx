import { Container } from "@/components/ui/layout";
import { PageSkeleton } from "@/components/ui/states";

/**
 * Route-level loading state for public pages while async Server
 * Components await the Laravel API.
 */
export default function Loading() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 font-sans dark:bg-black">
      <div className="h-14 shrink-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />
      <main className="flex-1 py-12">
        <Container>
          <PageSkeleton cards={3} />
        </Container>
      </main>
    </div>
  );
}
