import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Particles from "@/components/ui/particles";
import HyperText from "@/components/ui/hyper-text";

export default function NotFoundError() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [color, setColor] = useState("#ffffff");

  useEffect(() => {
    setColor(theme === "dark" ? "#ffffff" : "#000000");
  }, [theme]);

  return (
    <div className="relative h-svh">
      <Particles
        className="absolute inset-0"
        quantity={100}
        ease={80}
        color={color}
        refresh
      />
      <div className="relative m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] font-bold leading-tight bg-gradient-to-b from-foreground to-muted-foreground/80 bg-clip-text text-transparent">
          404
        </h1>
        <HyperText
          className="text-2xl font-bold text-black dark:text-white"
          text="抱歉，页面未找到"
        />
        <p className="text-center text-muted-foreground">
          您要访问的页面可能已被移动、删除或暂时不可用
        </p>
        <div className="mt-6 flex gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            返回
          </Button>
          <Button onClick={() => navigate("/")}>首页</Button>
        </div>
      </div>
    </div>
  );
}
