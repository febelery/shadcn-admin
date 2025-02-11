import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HyperText from "@/components/ui/hyper-text";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";

export default function ServerError() {
  const navigate = useNavigate();

  return (
    <div className="relative h-svh">
      <DotPattern
        className={cn(
          "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
        )}
      />

      <div className="relative m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] font-bold leading-tight bg-linear-to-b from-foreground to-muted-foreground/80 bg-clip-text text-transparent">
          500
        </h1>
        <HyperText
          className="text-2xl font-bold text-black dark:text-white"
          text="抱歉，服务器出错了"
        />
        <p className="text-center text-muted-foreground">
          服务器遇到了一些问题，请稍后再试
        </p>
        <div className="mt-6 flex gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            返回
          </Button>
        </div>
      </div>
    </div>
  );
}
