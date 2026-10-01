import StudioClient from "./studio-client";
import { examples, findExample } from "../example-data";

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ example?: string | string[]; blank?: string }>;
}) {
  const parameters = await searchParams;
  const query = parameters.example;
  const selected = typeof query === "string" ? findExample(query) : undefined;
  if (parameters.blank === "1") return <StudioClient requestedProject />;
  return (
    <StudioClient
      initialProject={(selected ?? examples[0]).project}
      requestedProject={Boolean(selected)}
    />
  );
}
