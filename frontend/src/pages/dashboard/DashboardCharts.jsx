import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export function RevenueChart({ data }) {
  const { isDark } = useTheme();
  
  // Example mapping if data exists, else use dummy for demo
  const chartData = data || [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 1890 },
    { name: 'Jun', value: 2390 },
  ];

  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: textColor, fontSize: 10, fontWeight: 600 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: textColor, fontSize: 10, fontWeight: 600 }}
          />
          <Tooltip 
            cursor={{ fill: isDark ? '#1E293B' : '#F8FAFC' }}
            contentStyle={{ 
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
              borderRadius: '12px',
              fontSize: '12px',
              color: isDark ? '#F8FAFC' : '#1E293B'
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#E8192C' : '#E8192C80'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ArticlesChart({ data }) {
  const { isDark } = useTheme();
  
  const chartData = data || [
    { name: 'Mon', count: 120 },
    { name: 'Tue', count: 150 },
    { name: 'Wed', count: 180 },
    { name: 'Thu', count: 140 },
    { name: 'Fri', count: 160 },
    { name: 'Sat', count: 190 },
  ];

  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: textColor, fontSize: 10, fontWeight: 600 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: textColor, fontSize: 10, fontWeight: 600 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
              borderRadius: '12px',
              fontSize: '12px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#E8192C" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#E8192C', strokeWidth: 2, stroke: '#FFF' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
