import { PipelineList } from "@/features/pipeline";
import { Providers } from "@/app/store/Providers";

export default function PipelinesPage() {
  return (
    <Providers>
      <PipelineList />
    </Providers>
  );
}
