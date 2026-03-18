
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createBetRecord } from "@/lib/api";

const CreateBet = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    userId: "",
    site: "JE",
    product: "SL",
    gameId: "0",
    amount: "",
    status: "1",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!form.userId || !form.amount) {
      toast({ title: "Error", description: "User ID and Amount are required.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const payload = {
      userId: Number(form.userId),
      amount: Number(form.amount),
      site: form.site || "JE",
      product: form.product || "SL",
      gameId: form.gameId || "0",
      status: Number(form.status),
    };

    try {
      const res = await createBetRecord(payload);
      if (res.status === 200) {
        toast({
          title: "Success",
          description: "Bet record created successfully.",
        });
        setForm({
          userId: "",
          site: "JE",
          product: "SL",
          gameId: "0",
          amount: "",
          status: "1",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.msg || "Failed to create bet record.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Bet Record (Manual)</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="userId">User ID (Required)</Label>
            <Input
              id="userId"
              name="userId"
              type="number"
              value={form.userId}
              onChange={handleInputChange}
              placeholder="e.g., 32545513"
              required
            />
          </div>
          <div>
            <Label htmlFor="site">Provider Code</Label>
            <Input
              id="site"
              name="site"
              value={form.site}
              onChange={handleInputChange}
              placeholder="e.g., JE, JD"
              required
            />
          </div>
          <div>
            <Label htmlFor="product">Game Type</Label>
            <Select
              name="product"
              value={form.product}
              onValueChange={(value) => handleSelectChange("product", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select game type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SL">SL</SelectItem>
                <SelectItem value="FI">FI</SelectItem>
                <SelectItem value="TB">TB</SelectItem>
                <SelectItem value="LC">LC</SelectItem>
                <SelectItem value="SP">SP</SelectItem>
                <SelectItem value="PK">PK</SelectItem>
                <SelectItem value="ES">ES</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="gameId">Game ID</Label>
            <Input
              id="gameId"
              name="gameId"
              value={form.gameId}
              onChange={handleInputChange}
              placeholder="e.g., 51"
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount (Positive for win, Negative for loss)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleInputChange}
              placeholder="e.g., 100 or -100"
              required
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              name="status"
              value={form.status}
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Valid</SelectItem>
                <SelectItem value="0">Running</SelectItem>
                <SelectItem value="-1">Invalid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Bet"}
        </Button>
      </form>
    </div>
  );
};

export default CreateBet;
