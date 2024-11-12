import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { LockIcon, UserIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LoginApi, TwoFactorLoginApi } from "@/services/user";
import { QRCodeSVG } from "qrcode.react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const QRCODE_EXPIRE = 60;
const TWO_FACTOR_POLL_INTERVAL = 2000;

const loginFormSchema = z.object({
  username: z.string().min(2, { message: "用户名至少需要2个字符" }),
  password: z.string().min(4, { message: "密码至少需要4个字符" }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function Login() {
  const { toast } = useToast();
  const pollIntervalRef = useRef<{
    pollInterval: NodeJS.Timeout | null;
    cleanupTimeout: NodeJS.Timeout | null;
  }>({ pollInterval: null, cleanupTimeout: null });
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const [state, setState] = useState({
    needTwoFactor: false,
    qrCodeUrl: "",
    showPassword: false,
    countdown: QRCODE_EXPIRE,
    loginError: ""
  });

  const updateState = useCallback((updates: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    const subscription = form.watch(() => {
      updateState({ loginError: "" });
    });
    return () => subscription.unsubscribe();
  }, [form, updateState]);

  useEffect(() => {
    if (!state.needTwoFactor || state.countdown <= 0) return;

    const timer = setInterval(() => {
      setState(prev => ({
        ...prev,
        countdown: prev.countdown - 1
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [state.needTwoFactor, state.countdown]);

  const clearAllTimers = useCallback(() => {
    if (pollIntervalRef.current.pollInterval) {
      clearInterval(pollIntervalRef.current.pollInterval);
      pollIntervalRef.current.pollInterval = null;
    }
    if (pollIntervalRef.current.cleanupTimeout) {
      clearTimeout(pollIntervalRef.current.cleanupTimeout);
      pollIntervalRef.current.cleanupTimeout = null;
    }
  }, []);

  const handleBackToLogin = useCallback(() => {
    clearAllTimers();
    setState(prev => ({
      ...prev,
      needTwoFactor: false,
      countdown: QRCODE_EXPIRE
    }));
    form.reset();
  }, [clearAllTimers, form]);

  const handleTwoFactorLogin = useCallback(async (twoFactorKey: string) => {
    clearAllTimers();

    pollIntervalRef.current.pollInterval = setInterval(async () => {
      try {
        const { data: response } = await TwoFactorLoginApi(twoFactorKey);
        if (response.token) {
          clearAllTimers();
          toast({
            description: "登录成功",
            className: "bg-green-500 text-white border-green-600",
          });
        }
      } catch (error) {
        console.error("二次验证检查失败:", error);
      }
    }, TWO_FACTOR_POLL_INTERVAL);

    pollIntervalRef.current.cleanupTimeout = setTimeout(() => {
      clearAllTimers();
    }, QRCODE_EXPIRE * 1000);
  }, [clearAllTimers, toast]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const onSubmit = useCallback(
    async (formValues: LoginFormValues) => {
      try {
        updateState({ loginError: "" });
        const { data: response } = await LoginApi(
          formValues.username,
          formValues.password
        );

        if (response.need_two_factor) {
          updateState({
            needTwoFactor: true,
            qrCodeUrl: "https://example.com/qr-code"
          });
          handleTwoFactorLogin(response.two_factor_key);
        }
      } catch (error: any) {
        console.error("登录失败:", error);
        updateState({ loginError: error.response?.data?.message || error.message || "登录失败，请稍后重试" });
      }
    },
    [handleTwoFactorLogin]
  );

  const loginForm = useMemo(
    () => (
      <motion.div
        key="login"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <CardHeader className="space-y-3 pb-4">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <LockIcon className="w-8 h-8 text-primary" />
          </motion.div>
          <CardTitle className="text-xl font-medium text-center">
            登录
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            请输入您的账号信息
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>用户名</FormLabel>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input className="pl-9 h-10" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>密码</FormLabel>
                      <Link
                        to="#"
                        className="text-xs text-primary hover:underline"
                      >
                        忘记密码?
                      </Link>
                    </div>
                    <div className="relative">
                      <LockIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input
                          type={state.showPassword ? "text" : "password"}
                          className="pl-9 pr-9 h-10"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {state.showPassword ? (
                          <EyeOffIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {state.loginError && (
                <p className="text-red-500 text-xs">{state.loginError}</p>
              )}

              <Button type="submit" className="w-full h-10">
                登录
              </Button>
            </form>
          </Form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            还没有账号?{" "}
            <Link to="#" className="text-primary hover:underline">
              联系我们
            </Link>
          </div>
        </CardContent>
      </motion.div>
    ),
    [form, state.showPassword, state.loginError]
  );

  const twoFactorAuth = useMemo(
    () => (
      <motion.div
        key="2fa"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <CardHeader className="space-y-3 pb-4">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 mx-auto mb-2"
          >
            <div className="relative w-full h-full">
              <div className="absolute inset-0 w-full h-full rounded-full border-4 border-muted" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-baseline">
                  <span className="text-xl font-semibold">{state.countdown}</span>
                </div>
              </div>
              <svg
                className="absolute inset-0 w-full h-full rotate-[-90deg]"
                viewBox="0 0 100 100"
              >
                <circle
                  className="transition-all duration-1000 ease-linear"
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={`${(state.countdown / QRCODE_EXPIRE) * 301} 301`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </motion.div>
          <CardTitle className="text-xl font-medium text-center">
            二次验证
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            请使用微信扫描二维码
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <QRCodeSVG
              value={state.qrCodeUrl}
              size={192}
              level="H"
              marginSize={1}
              className="p-2 bg-white rounded-lg"
            />
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              className="text-sm text-muted-foreground"
              onClick={handleBackToLogin}
            >
              返回登录
            </Button>
          </div>
        </CardContent>
      </motion.div>
    ),
    [state.countdown, state.qrCodeUrl]
  );

  return (
    <div className="flex h-screen w-full items-center justify-center px-4 bg-gradient-to-br from-background to-secondary/20 relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="mx-auto w-[380px] border shadow-lg bg-background/95">
          <AnimatePresence mode="wait">
            {!state.needTwoFactor ? loginForm : twoFactorAuth}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}
