'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

// Types for our data
type MetricCategory = {
  name: string;
  description: string;
  metrics: Metric[];
};

type Metric = {
  id: string;
  label: string;
  format?: (value: number) => string;
};

// Organized metrics by category for better UX
const METRIC_CATEGORIES: MetricCategory[] = [
  {
    name: "Engagement",
    description: "How users interact with your products",
    metrics: [
      { 
        id: 'timeSpent', 
        label: 'Time spent in Whop',
        format: (value) => `${(value / 60).toFixed(1)}h`
      },
      { 
        id: 'engagement', 
        label: 'Daily active time',
        format: (value) => `${(value / 60).toFixed(1)}h`
      },
      { 
        id: 'retention', 
        label: 'Retention rate',
        format: (value) => `${value}%`
      },
    ]
  },
  {
    name: "Revenue",
    description: "Financial metrics and performance",
    metrics: [
      { 
        id: 'revenue', 
        label: 'Total Revenue',
        format: (value) => `$${value.toLocaleString()}`
      },
      { 
        id: 'arpu', 
        label: 'Avg. Revenue per User',
        format: (value) => `$${value.toLocaleString()}`
      },
      { 
        id: 'mrr', 
        label: 'Monthly Recurring Revenue',
        format: (value) => `$${value.toLocaleString()}`
      },
    ]
  },
  {
    name: "Growth",
    description: "User acquisition and expansion",
    metrics: [
      { 
        id: 'customers', 
        label: 'Total Customers',
        format: (value) => value.toLocaleString()
      },
      { 
        id: 'growth', 
        label: 'MoM Growth',
        format: (value) => `${value}%`
      },
      { 
        id: 'conversion', 
        label: 'Conversion Rate',
        format: (value) => `${value}%`
      },
    ]
  },
  {
    name: "Product",
    description: "Product usage and satisfaction",
    metrics: [
      { 
        id: 'products', 
        label: 'Active Products',
        format: (value) => value.toString()
      },
      { 
        id: 'satisfaction', 
        label: 'CSAT Score',
        format: (value) => `${(value / 100).toFixed(1)}`
      },
      { 
        id: 'reviews', 
        label: 'Positive Reviews',
        format: (value) => `${value}%`
      },
    ]
  },
];

// Flatten metrics for easier access
const ALL_METRICS = METRIC_CATEGORIES.flatMap(category => category.metrics);

// Types for our user data
type User = {
  id: number;
  username: string;
  name: string;
  avatarUrl: string;
  rank?: number;
  metrics: {
    [key: string]: number;
  };
};

export default function UserSidebar() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(['timeSpent']);
  const [activeSortDimension, setActiveSortDimension] = useState('timeSpent');
  const [open, setOpen] = useState(false);

  // Generate dummy data on component mount
  useEffect(() => {
    const generateDummyData = (): User[] => {
      const dummyUsers: User[] = [];
      const adjectives = ['Cool', 'Super', 'Mega', 'Ultra', 'Hyper', 'Pro', 'Elite'];
      const nouns = ['Coder', 'Dev', 'Ninja', 'Guru', 'Master', 'Wizard', 'Hero'];
      
      for (let i = 0; i < 100; i++) {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const username = `${adj}${noun}${Math.floor(Math.random() * 1000)}`;
        const name = `${adj} ${noun}`;
        
        const metrics: { [key: string]: number } = {};
        ALL_METRICS.forEach(metric => {
          // Generate appropriate random values based on metric type
          if (metric.id.includes('rate') || metric.id === 'growth' || metric.id === 'reviews') {
            metrics[metric.id] = Math.floor(Math.random() * 100); // Percentage
          } else if (metric.id.includes('time')) {
            metrics[metric.id] = Math.floor(Math.random() * 480); // Minutes
          } else if (metric.id.includes('revenue')) {
            metrics[metric.id] = Math.floor(Math.random() * 10000); // Dollars
          } else if (metric.id === 'satisfaction') {
            metrics[metric.id] = Math.floor(Math.random() * 500); // 0-5.00 score (x100)
          } else if (metric.id === 'products') {
            metrics[metric.id] = Math.floor(Math.random() * 10) + 1; // 1-10 products
          } else {
            metrics[metric.id] = Math.floor(Math.random() * 10000);
          }
        });

        dummyUsers.push({
          id: i,
          username: username.toLowerCase(),
          name,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          metrics
        });
      }
      return dummyUsers;
    };

    setUsers(generateDummyData());
  }, []);

  // Filter and sort users based on current dimension and search query
  const filteredAndSortedUsers = users
    .filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      return (b.metrics[activeSortDimension] || 0) - (a.metrics[activeSortDimension] || 0);
    });

  // Add ranking based on sort
  const rankedUsers = filteredAndSortedUsers.map((user, index) => ({
    ...user,
    rank: index + 1
  }));

  const getMetricFormat = (metricId: string) => {
    return ALL_METRICS.find(m => m.id === metricId)?.format || ((value: number) => value.toLocaleString());
  };

  return (
    <div className="fixed top-0 right-0 h-screen w-[400px] flex flex-col bg-white border-l border-gray-100 shadow-sm">
      <div className="flex-none px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => {}} 
              className="p-2 -ml-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <h2 className="text-[15px] font-semibold text-gray-900">Users</h2>
              <span className="text-sm text-gray-400">181</span>
            </div>
          </div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                <span>{ALL_METRICS.find(m => m.id === activeSortDimension)?.label}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="end">
              <div className="flex flex-col max-h-[400px]">
                <div className="flex-none p-3 border-b border-gray-100">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-900">Configure user metrics</div>
                    <div className="text-xs text-gray-500">
                      Choose which metrics to display and how to rank your users.
                    </div>
                  </div>
                  <div className="mt-3 flex items-center px-2 py-1.5 bg-blue-50 rounded-lg">
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    <span className="ml-2 text-sm text-blue-600">
                      Sorting by: {ALL_METRICS.find(m => m.id === activeSortDimension)?.label}
                    </span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
                  <div className="p-3 space-y-4">
                    {METRIC_CATEGORIES.map((category) => (
                      <div key={category.name} className="space-y-2">
                        <div className="px-2 sticky top-0 bg-white z-10 pb-2">
                          <div className="font-medium text-sm text-gray-900">{category.name}</div>
                          <div className="text-xs text-gray-500">{category.description}</div>
                        </div>
                        <div className="space-y-0.5">
                          {category.metrics.map((metric) => {
                            const isSelected = selectedDimensions.includes(metric.id);
                            const isSorting = activeSortDimension === metric.id;
                            
                            return (
                              <div 
                                key={metric.id} 
                                className={`flex items-center px-2 py-2 rounded-lg group transition-colors ${
                                  isSorting ? 'bg-blue-50' : 'hover:bg-gray-50'
                                }`}
                              >
                                <label className="flex items-center flex-1 min-w-0 cursor-pointer">
                                  <Checkbox
                                    id={metric.id}
                                    checked={isSelected}
                                    className="h-4 w-4"
                                    onCheckedChange={(checked: boolean | 'indeterminate') => {
                                      if (checked === true) {
                                        setSelectedDimensions([...selectedDimensions, metric.id]);
                                      } else if (metric.id !== activeSortDimension) {
                                        setSelectedDimensions(selectedDimensions.filter(d => d !== metric.id));
                                      }
                                    }}
                                    disabled={isSorting && selectedDimensions.length === 1}
                                  />
                                  <span className="ml-2.5 text-sm text-gray-600 group-hover:text-gray-900 truncate">
                                    {metric.label}
                                  </span>
                                </label>
                                <button
                                  onClick={() => {
                                    setActiveSortDimension(metric.id);
                                    setOpen(false);
                                  }}
                                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                    isSorting 
                                      ? 'text-blue-600 bg-blue-100'
                                      : isSelected
                                        ? 'text-gray-500 hover:text-blue-600'
                                        : 'text-gray-300'
                                  }`}
                                  disabled={!isSelected}
                                >
                                  Sort
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search users"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-lg text-sm focus:outline-none focus:bg-gray-100 transition-colors"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-gray-100 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
        {rankedUsers.map((user) => (
          <div key={user.id} className="flex items-center px-5 py-3 hover:bg-gray-50 group transition-colors">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 relative rounded-full overflow-hidden bg-gray-100">
                <Image
                  src={user.avatarUrl}
                  alt={user.username}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </div>
              {user.rank <= 3 && (
                <div className={`absolute -top-1 -left-1 w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium text-white z-10 border-2 border-white shadow-sm
                  ${user.rank === 1 ? 'bg-yellow-500' : 
                    user.rank === 2 ? 'bg-gray-400' : 
                    'bg-amber-700'}`}>
                  {user.rank}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-yellow-400 rounded-full border-2 border-white" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <div className="font-medium text-[15px] text-gray-900 truncate leading-5">{user.name}</div>
              <div className="text-sm text-gray-500 truncate">@{user.username}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm font-medium tabular-nums text-gray-900">
                {activeSortDimension === 'timeSpent' && (
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {(activeSortDimension === 'revenue' || activeSortDimension === 'arpu' || activeSortDimension === 'mrr') && (
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {activeSortDimension === 'customers' && (
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
                {(activeSortDimension === 'engagement' || activeSortDimension === 'growth' || activeSortDimension === 'conversion') && (
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                )}
                {activeSortDimension === 'satisfaction' && (
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {activeSortDimension === 'products' && (
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                )}
                {activeSortDimension === 'reviews' && (
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                )}
                {getMetricFormat(activeSortDimension)(user.metrics[activeSortDimension])}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0" align="end">
                  <div className="px-2 py-1.5 border-b border-gray-100">
                    <div className="font-medium text-sm text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">@{user.username}</div>
                  </div>
                  <div className="p-2 space-y-3">
                    {METRIC_CATEGORIES.map(category => {
                      const categoryMetrics = selectedDimensions
                        .filter(d => category.metrics.find(m => m.id === d))
                        .map(d => category.metrics.find(m => m.id === d)!);
                        
                      if (categoryMetrics.length === 0) return null;
                      
                      return (
                        <div key={category.name}>
                          <div className="text-xs font-medium text-gray-500 mb-1.5">{category.name}</div>
                          <div className="space-y-2">
                            {categoryMetrics.map(metric => {
                              const value = user.metrics[metric.id];
                              const formattedValue = getMetricFormat(metric.id)(value);
                              const isActive = metric.id === activeSortDimension;
                              
                              return (
                                <div 
                                  key={metric.id} 
                                  className={`flex items-center justify-between ${
                                    isActive ? 'text-blue-600' : 'text-gray-600'
                                  }`}
                                >
                                  <span className="text-sm">{metric.label}</span>
                                  <span className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>
                                    {formattedValue}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
