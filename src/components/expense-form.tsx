"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

interface Category {
  id?: number;
  name: string;
  icon: string;
  color: string;
}

interface ExpenseFormProps {
  categories: Category[];
  onSuccess: () => void;
  editExpense?: {
    id: number;
    amount: number;
    description?: string;
    categoryId: number;
    date: Date;
    receiptUrl?: string;
  };
  trigger?: React.ReactNode;
}

export function ExpenseForm({
  categories,
  onSuccess,
  editExpense,
  trigger,
}: ExpenseFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState(editExpense?.amount?.toString() || "");
  const [description, setDescription] = useState(
    editExpense?.description || "",
  );
  const [categoryId, setCategoryId] = useState(
    editExpense?.categoryId?.toString() || "",
  );
  const [date, setDate] = useState<Date>(
    editExpense?.date ? new Date(editExpense.date) : new Date(),
  );
  const selectableCategories = categories.filter(
    (category): category is Category & { id: number } => category.id !== undefined,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsLoading(true);

    try {
      if (editExpense) {
        await db.expenses.update(editExpense.id, {
          amount: Number.parseFloat(amount),
          description: description || undefined,
          categoryId: Number.parseInt(categoryId),
          date: date,
          updatedAt: new Date(),
        });
        toast.success("Expense updated!");
      } else {
        await db.expenses.add({
          userId: user.id,
          amount: Number.parseFloat(amount),
          description: description || undefined,
          categoryId: Number.parseInt(categoryId),
          date: date,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        toast.success("Expense added!");
      }

      setOpen(false);
      resetForm();
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save expense",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    if (!editExpense) {
      setAmount("");
      setDescription("");
      setCategoryId("");
      setDate(new Date());
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            data-design-id="add-expense-btn"
            className="gradient-primary text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
          >
            <span className="mr-2">+</span> Add Expense
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        data-design-id="expense-form-dialog"
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle data-design-id="expense-form-title">
            {editExpense ? "Edit Expense" : "Add New Expense"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div data-design-id="expense-amount-field" className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="pl-8 h-11 text-lg font-medium"
              />
            </div>
          </div>

          <div data-design-id="expense-category-field" className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {selectableCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div data-design-id="expense-date-field" className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-11 justify-start text-left font-normal"
                >
                  <span className="mr-2">📅</span>
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div data-design-id="expense-description-field" className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-design-id="expense-submit-btn"
              type="submit"
              className="flex-1 gradient-primary text-white"
              disabled={isLoading || !amount || !categoryId}
            >
              {isLoading ? "Saving..." : editExpense ? "Update" : "Add Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
