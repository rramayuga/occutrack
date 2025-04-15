
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { RoomUsageData } from '../types/room';

interface RoomUsageChartProps {
  data: RoomUsageData[];
}

const RoomUsageChart: React.FC<RoomUsageChartProps> = ({ data }) => {
  return (
    <div className="h-[400px] w-full">
      <ChartContainer config={{
        utilizationHours: { label: "Hours", color: "#3b82f6" },
        reservations: { label: "Reservations", color: "#10b981" }
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.slice(0, 10)}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="roomName" 
              angle={-45} 
              textAnchor="end" 
              tick={{ fontSize: 12 }}
              height={70}
            />
            <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar 
              dataKey="utilizationHours" 
              name="Hours Used" 
              yAxisId="left" 
              fill="var(--color-utilizationHours)" 
            />
            <Bar 
              dataKey="reservations" 
              name="Total Reservations" 
              yAxisId="right" 
              fill="var(--color-reservations)" 
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default RoomUsageChart;
