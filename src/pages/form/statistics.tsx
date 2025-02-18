"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { type FormField, builtFieldTypes } from "./form.d";
import { FormApi } from "@/services/form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

import { NumberTicker } from "@/components/magicui/number-ticker";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Cover } from "@/components/ui/cover";

import { FieldSection } from "./components/field-section";
import { FilterSection } from "./components/filter-section";
import { SparklesCore } from "@/components/ui/sparkles";

const HIDDEN_TYPES = ["text", "divider"];

const getFieldTypeName = (type: string) => {
  return builtFieldTypes.find((f) => f.type === type)?.name || type;
};

// 统计卡片组件
const StatCard = ({ title, value, className }: any) => (
  <Card className={cn("relative group overflow-hidden", className)}>
    <div className="absolute inset-0 z-0">
      <SparklesCore
        background="transparent"
        minSize={0.4}
        maxSize={1.2}
        particleColor="#ccc"
        particleDensity={80}
        speed={1}
        className="w-full h-full opacity-0 group-hover:opacity-50 transition-opacity duration-500"
      />
    </div>
    <GlowingEffect
      spread={40}
      glow
      disabled={false}
      proximity={64}
      inactiveZone={0.01}
    />
    <CardHeader className="relative">
      <CardTitle className="text-xl group-hover:text-primary transition-colors">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="relative">
      <div className="text-3xl font-bold transition-transform">
        <NumberTicker value={Number(value)} className="text-3xl font-bold" />
      </div>
    </CardContent>
  </Card>
);

// 导航项组件
const NavItem = ({
  field,
  onClick,
}: {
  field: FormField;
  onClick: () => void;
}) => (
  <motion.a
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    href={`#${field.key}`}
    className={cn(
      "group flex items-start gap-2 px-3 py-2.5 text-sm rounded-md",
      "hover:bg-muted/80 hover:shadow-sm",
      "transition-all duration-200 ease-in-out"
    )}
  >
    <span
      className={cn(
        "flex items-center justify-center w-6 h-6 text-xs font-medium bg-primary/10 text-primary rounded-md shrink-0 transition-colors",
        "group-hover:bg-primary group-hover:text-primary-foreground"
      )}
    >
      {field.index}
    </span>
    <div className="flex flex-col min-w-0 gap-1">
      <span className="truncate font-medium">{field.title}</span>
      <span
        className={cn(
          "text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded w-fit line-clamp-3 transition-all duration-200",
          "group-hover:bg-primary/10"
        )}
      >
        {getFieldTypeName(field.type)}
      </span>
    </div>
  </motion.a>
);

export default function FormStatistics() {
  const isMobile = useIsMobile();
  const [fields, setFields] = useState<FormField[][]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [filterParams, setFilterParams] = useState({});
  const [formTitle, setFormTitle] = useState("");

  const { fields: filteredFields, navFields } = useMemo(() => {
    if (!fields[0]) return { fields: [], navFields: [] };
    const allFields = fields[0];
    const validFields = allFields.filter((f) => !HIDDEN_TYPES.includes(f.type));
    return {
      fields: validFields,
      navFields: validFields,
    };
  }, [fields]);

  // useEffect Hooks
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setLoading(true);
        const formId = "1";
        const { fields: responseFields, title } = await FormApi(formId);
        setFields([responseFields]);
        setFormTitle(title);
      } catch (error) {
        console.error("获取表单数据失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, []);

  // 滚动到指定区域
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const toolbarHeight = 56;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - toolbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // 条件渲染
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 顶部标题 */}
      <Card className="m-4 py-16 ">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            {formTitle}
          </h1>
          <div className="flex items-center justify-center gap-3 text-lg font-medium text-muted-foreground">
            <Cover>数据统计与分析</Cover>
          </div>
        </div>
      </Card>

      {/* 顶部统计区域  */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        <StatCard
          title="提交总数据"
          value="14"
          className="hover:shadow-lg transition-all duration-300"
        />
        <StatCard
          title="参与用户"
          value="0"
          className="hover:shadow-lg transition-all duration-300"
        />
        <StatCard
          title="浏览数"
          value="17"
          className="hover:shadow-lg transition-all duration-300"
        />
      </div>

      {/* 筛选工具栏  */}
      <FilterSection fields={fields} onFilterParamsChange={setFilterParams} />

      <div className="flex-1 flex">
        {/* 左侧导航  */}
        {!isMobile && (
          <nav className="w-64 h-[calc(100vh-8.5rem)] sticky top-14 shrink-0 overflow-hidden border-r bg-card/50 backdrop-blur-sm">
            <div className="h-full overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20">
              <motion.div className="space-y-2">
                {navFields.map((field) => (
                  <NavItem
                    key={field.key}
                    field={field}
                    onClick={() => scrollToSection(field.key || "")}
                  />
                ))}
              </motion.div>
            </div>
          </nav>
        )}

        {/* 主体内容 */}
        <main className="flex-1 px-4 py-6 space-y-6">
          {filteredFields.map((field: FormField) => (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4 }}
            >
              <FieldSection
                field={field}
                downloadingId={downloadingId}
                setDownloadingId={setDownloadingId}
                filterParams={filterParams}
                className="hover:shadow-lg transition-all duration-300"
              />
            </motion.div>
          ))}
        </main>
      </div>
    </div>
  );
}
