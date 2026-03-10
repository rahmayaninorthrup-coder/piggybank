"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { ExpenseForm } from "./expense-form";

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

interface ExpenseListProps {
  expenses: Expense[];
  categories: Category[];
  onRefresh: () => void;
  currency?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  IDR: "Rp",
  SGD: "S$",
  EUR: "€",
  AUD: "A$",
};

export function ExpenseList({
  expenses,
  categories,
  onRefresh,
  currency = "USD",
}: ExpenseListProps) {
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  const formatAmount = (amount: number) => {
    if (currency === "IDR") {
      return `${currencySymbol}${amount.toLocaleString("id-ID", { minimumFractionDigits: 0 })}`;
    }
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      await db.expenses.delete(id);
      toast.success("Expense deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete expense");
    }
  };

  const groupedExpenses = expenses.reduce(
    (acc, expense) => {
      const dateKey = format(new Date(expense.date), "yyyy-MM-dd");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(expense);
      return acc;
    },
    {} as Record<string, Expense[]>,
  );

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) =>
    b.localeCompare(a),
  );

  if (expenses.length === 0) {
    return (
      <Card data-design-id="expense-list-empty" className="p-8 text-center">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium mb-2">No expenses yet</h3>
        <p className="text-muted-foreground text-sm">
          Start tracking your spending by adding your first expense
        </p>
      </Card>
    );
  }

  return (
    <>
      <ScrollArea
        data-design-id="expense-list-scroll"
        className="h-[calc(100vh-320px)]"
      >
        <div className="space-y-6 pr-4">
          {sortedDates.map((dateKey) => {
            const dayExpenses = groupedExpenses[dateKey];
            const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
            const dateObj = new Date(dateKey);

            return (
              <div key={dateKey} data-design-id={`expense-group-${dateKey}`}>
                <div className="flex items-center justify-between mb-3 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex flex-col items-center justify-center text-xs">
                      <span className="font-bold text-foreground">
                        {format(dateObj, "d")}
                      </span>
                      <span className="text-muted-foreground uppercase">
                        {format(dateObj, "EEE")}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(dateObj, "MMMM yyyy")}
                    </span>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {formatAmount(dayTotal)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {dayExpenses.map((expense) => {
                    if (expense.id === undefined) {
                      return null;
                    }

                    const expenseId = expense.id;
                    const receiptUrl = expense.receiptUrl;

                    return (
                      <Card
                        key={expenseId}
                        data-design-id={`expense-item-${expenseId}`}
                        className="p-4 hover:shadow-md transition-shadow group"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                            style={{
                              backgroundColor: `${expense.category?.color}20`,
                            }}
                          >
                            {expense.category?.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                              {expense.category?.name}
                              </span>
                              {receiptUrl && (
                                <button
                                  onClick={() =>
                                    setViewingReceipt(receiptUrl ?? null)
                                  }
                                  className="text-xs text-primary hover:underline"
                                >
                                  📷 View
                                </button>
                              )}
                            </div>
                            {expense.description && (
                              <p className="text-sm text-muted-foreground truncate">
                                {expense.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <span className="font-semibold text-lg font-mono">
                              {formatAmount(expense.amount)}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                                >
                                  ⋮
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <ExpenseForm
                                  categories={categories}
                                  onSuccess={onRefresh}
                                  editExpense={{
                                    id: expenseId,
                                    amount: expense.amount,
                                    description: expense.description,
                                    categoryId: expense.categoryId,
                                    date: expense.date,
                                    receiptUrl,
                                  }}
                                  trigger={
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      ✏️ Edit
                                    </DropdownMenuItem>
                                  }
                                />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDelete(expenseId)}
                                >
                                  🗑️ Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <Dialog
        open={!!viewingReceipt}
        onOpenChange={() => setViewingReceipt(null)}
      >
        <DialogContent
          data-design-id="receipt-viewer-dialog"
          className="sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
          </DialogHeader>
          {viewingReceipt && (
            <img
              src={viewingReceipt}
              alt="Receipt"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
