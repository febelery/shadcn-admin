import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GradualSpacing from "@/components/ui/gradual-spacing";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";

export default function UnauthorizedError() {
  const navigate = useNavigate();

  return (
    <div className="relative h-svh ">
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]",
          "absolute inset-0 h-[83%] skew-y-12"
        )}
      />

      <div className="relative m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] font-bold leading-tight text-red-600">
          401
        </h1>
        <GradualSpacing
          className="text-2xl font-bold text-black dark:text-white"
          text="没有权限"
        />
        <p className="text-center text-muted-foreground">
          您可能没有权限访问此页面
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
