import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Particles from "@/components/ui/particles";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Login() {
  const { theme } = useTheme();
  const [color, setColor] = useState("#ffffff");

  useEffect(() => {
    setColor(theme === "dark" ? "#ffffff" : "#000000");
  }, [theme]);

  return (
    <div className="flex h-screen w-full items-center justify-center px-4 bg-gradient-to-br from-background to-secondary/20">
      <Particles
        className="absolute inset-0"
        quantity={150}
        ease={100}
        color={color}
        refresh
      />
      <Card className="mx-auto max-w-sm w-[100%] border-2 shadow-lg backdrop-blur-sm bg-background/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">登录</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            请输入您的账号信息
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="font-medium">
                用户名
              </Label>
              <Input
                id="name"
                type="name"
                required
                className="transition-all duration-200 hover:border-primary focus:border-primary"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password" className="font-medium">
                  密码
                </Label>
                <Link
                  to="#"
                  className="ml-auto inline-block text-sm text-primary hover:underline"
                >
                  忘记密码?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                className="transition-all duration-200 hover:border-primary focus:border-primary"
              />
            </div>
            <Button
              type="submit"
              className="w-full font-medium hover:opacity-90 transition-opacity"
            >
              登录
            </Button>
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            还没有账号?{" "}
            <Link to="#" className="text-primary hover:underline font-medium">
              联系我们
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
