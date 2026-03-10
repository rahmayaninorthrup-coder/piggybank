"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/db";
import { useCallback, useEffect, useState } from "react";
import { ExpenseForm } from "./expense-form";
import { ExpenseList } from "./expense-list";
import { ExpenseSummary } from "./expense-summary";

interface Category {
  id?: number;
  name: string;
  icon: string;
  color: string;
}

interface Expense {
  id?: number;
  amount: number;
  description?: string;
  date: Date;
  categoryId: number;
  category?: Category;
  receiptUrl?: string;
  createdAt: Date;
}

interface Summary {
  total: number;
  byCategory: {
    categoryId: number;
    categoryName: string;
    icon: string;
    color: string;
    total: number;
    count: number;
  }[];
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, byCategory: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const seedCategories = useCallback(async () => {
    const existingCats = await db.categories.count();
    if (existingCats === 0) {
      const defaultCategories = [
        { name: "Food", icon: "🍔", color: "#ef4444" },
        { name: "Transport", icon: "🚗", color: "#3b82f6" },
        { name: "Shopping", icon: "🛍️", color: "#ec4899" },
        { name: "Entertainment", icon: "🎬", color: "#8b5cf6" },
        { name: "Bills", icon: "📄", color: "#f59e0b" },
        { name: "Health", icon: "💊", color: "#10b981" },
        { name: "Other", icon: "📦", color: "#6b7280" },
      ];
      await db.categories.bulkAdd(defaultCategories);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      await seedCategories();

      const cats = await db.categories.toArray();
      setCategories(cats);

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const exps = await db.expenses
        .where("userId")
        .equals(user.id)
        .filter((e) => e.date >= startDate && e.date <= endDate)
        .toArray();

      const expsWithCategory = exps.map((exp) => ({
        ...exp,
        category: cats.find((c) => c.id === exp.categoryId),
      }));

      setExpenses(
        expsWithCategory.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      );

      const total = exps.reduce((sum, e) => sum + e.amount, 0);

      const byCategoryMap = new Map<
        number,
        { total: number; count: number; category: Category }
      >();
      for (const exp of exps) {
        const cat = cats.find((c) => c.id === exp.categoryId);
        if (cat) {
          const existing = byCategoryMap.get(exp.categoryId);
          if (existing) {
            existing.total += exp.amount;
            existing.count += 1;
          } else {
            byCategoryMap.set(exp.categoryId, {
              total: exp.amount,
              count: 1,
              category: cat,
            });
          }
        }
      }

      const byCategory = Array.from(byCategoryMap.entries()).map(
        ([categoryId, item]) => ({
        categoryId,
        categoryName: item.category.name,
        icon: item.category.icon,
        color: item.category.color,
        total: item.total,
        count: item.count,
      }),
      );

      setSummary({ total, byCategory });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [month, seedCategories, user?.id, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";

  if (isLoading) {
    return (
      <div
        data-design-id="dashboard-loading"
        className="min-h-screen flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading your expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-design-id="dashboard-container"
      className="min-h-screen bg-background"
    >
      <header
        data-design-id="dashboard-header"
        className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div
            data-design-id="dashboard-logo"
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">
                Expense Journal
              </h1>
              <p className="text-xs text-muted-foreground">
                Mobile-first expense journal
              </p>
            </div>
          </div>

          <div
            data-design-id="dashboard-actions"
            className="flex items-center gap-3"
          >
            <ExpenseForm categories={categories} onSuccess={fetchData} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                data-design-id="dashboard-user-menu"
                align="end"
                className="w-56"
              >
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main
        data-design-id="dashboard-main"
        className="container mx-auto px-4 py-6"
      >
        <div
          data-design-id="dashboard-filters"
          className="flex flex-wrap items-center gap-3 mb-6"
        >
          <Select
            value={month.toString()}
            onValueChange={(v) => setMonth(Number.parseInt(v))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((name, i) => (
                <SelectItem key={name} value={(i + 1).toString()}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={year.toString()}
            onValueChange={(v) => setYear(Number.parseInt(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMonth(new Date().getMonth() + 1);
              setYear(new Date().getFullYear());
            }}
          >
            Today
          </Button>
        </div>

        <div
          data-design-id="dashboard-content"
          className="grid lg:grid-cols-3 gap-6"
        >
          <div
            data-design-id="dashboard-summary-col"
            className="lg:col-span-1 order-2 lg:order-1"
          >
            <ExpenseSummary
              total={summary.total}
              byCategory={summary.byCategory}
              month={month}
              year={year}
              currency={user?.currency}
            />
          </div>

          <div
            data-design-id="dashboard-list-col"
            className="lg:col-span-2 order-1 lg:order-2"
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                data-design-id="dashboard-list-title"
                className="text-lg font-semibold"
              >
                Transactions
              </h2>
              <span
                data-design-id="dashboard-list-count"
                className="text-sm text-muted-foreground"
              >
                {expenses.length}{" "}
                {expenses.length === 1 ? "expense" : "expenses"}
              </span>
            </div>
            <ExpenseList
              expenses={expenses}
              categories={categories}
              onRefresh={fetchData}
              currency={user?.currency}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
