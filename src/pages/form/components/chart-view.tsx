import { useMemo } from "react";
import { FormField } from "@/pages/form/form.d";
import { ChartContainer } from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

interface ChartViewProps {
  field: FormField;
  data: any[];
}

export function ChartView({ field, data }: ChartViewProps) {
  const chartData = useMemo(() => {
    return (
      data?.map((item, index) => ({
        name: item.name,
        value: item.value,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`,
      })) || []
    );
  }, [data]);

  const chartHeight = useMemo(() => {
    const baseHeight = 45;
    const minHeight = 150;
    const maxHeight = 400;
    const padding = 60;
    const calculatedHeight = Math.max(
      minHeight,
      data.length * baseHeight + padding
    );
    return Math.min(calculatedHeight, maxHeight);
  }, [data.length]);

  return (
    <div id={`chart-${field.key}`} className="rounded-lg border p-4 shadow-sm">
      <ChartContainer
        config={{}}
        className="w-full hover:opacity-95 transition-opacity"
        style={{ height: `${chartHeight}px` }}
      >
        <BarChart
          accessibilityLayer
          className="w-full"
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 50, left: 50, bottom: 20 }}
        >
          <CartesianGrid
            horizontal={false}
            strokeDasharray="3 3"
            opacity={0.3}
          />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            axisLine={false}
            interval={0}
            width={120}
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickCount={5}
            style={{
              fontSize: "0.875rem",
            }}
          />
          <Bar
            dataKey="value"
            radius={[6, 6, 6, 6]}
            fill={`hsl(var(--primary))`}
            animationDuration={1000}
            animationBegin={0}
          >
            <LabelList
              dataKey="value"
              position="right"
              className="text-sm font-medium"
              offset={12}
              style={{
                fill: "hsl(var(--foreground))",
              }}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
