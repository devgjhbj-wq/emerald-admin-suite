
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
import { createDetailedBetRecord } from "@/lib/api";

const CreateBet = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    member: "",
    site: "JE",
    product: "",
    gameId: "",
    refNo: "",
    betTime: "",
    settleTime: "",
    bet: "",
    payout: "0",
    status: "1",
    userId: "",
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

    if (!form.member || !form.site || form.bet === "") {
      toast({ title: "Error", description: "Member, Site and Bet amount are required.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const payload: Record<string, string | number> = {
      member: form.member,
      site: form.site,
      bet: Number(form.bet),
      payout: Number(form.payout || 0),
      status: Number(form.status),
    };

    if (form.product) payload.product = form.product;
    if (form.gameId) payload.gameId = form.gameId;
    if (form.refNo) payload.refNo = form.refNo;
    
    if (form.betTime) {
      const bt = new Date(form.betTime);
      if (!isNaN(bt.getTime())) payload.betTime = bt.toISOString();
    }
    
    if (form.settleTime) {
      const st = new Date(form.settleTime);
      if (!isNaN(st.getTime())) payload.settleTime = st.toISOString();
    }
    
    if (form.userId) payload.userId = Number(form.userId);

    try {
      const res = await createDetailedBetRecord(payload as any);
      if (res.status === 200) {
        toast({
          title: "Success",
          description: res.data?.msg || "Bet record created successfully.",
        });
        setForm({
          member: "",
          site: "JE",
          product: "",
          gameId: "",
          refNo: "",
          betTime: "",
          settleTime: "",
          bet: "",
          payout: "0",
          status: "1",
          userId: "",
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
      <h1 className="text-2xl font-bold mb-4">Create Bet Record (Admin - Detailed)</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="member">Member Username (Required)</Label>
            <Input
              id="member"
              name="member"
              value={form.member}
              onChange={handleInputChange}
              placeholder="e.g., u32545526"
              required
            />
          </div>
          <div>
            <Label htmlFor="site">Provider Code (Required)</Label>
            <Input
              id="site"
              name="site"
              value={form.site}
              onChange={handleInputChange}
              placeholder="e.g., JE"
              required
            />
          </div>
          <div>
            <Label htmlFor="bet">Bet Amount (Required)</Label>
            <Input
              id="bet"
              name="bet"
              type="number"
              value={form.bet}
              onChange={handleInputChange}
              placeholder="e.g., 200"
              required
            />
          </div>
          <div>
            <Label htmlFor="payout">Payout</Label>
            <Input
              id="payout"
              name="payout"
              type="number"
              value={form.payout}
              onChange={handleInputChange}
              placeholder="e.g., 200"
            />
          </div>
          <div>
            <Label htmlFor="product">Game Type</Label>
            <Input
              id="product"
              name="product"
              value={form.product}
              onChange={handleInputChange}
              placeholder="e.g., SL"
            />
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
            <Label htmlFor="refNo">Reference Number</Label>
            <Input
              id="refNo"
              name="refNo"
              value={form.refNo}
              onChange={handleInputChange}
              placeholder="Auto-generated if empty"
            />
          </div>
          <div>
            <Label htmlFor="betTime">Bet Time</Label>
            <Input
              id="betTime"
              name="betTime"
              type="datetime-local"
              value={form.betTime}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="settleTime">Settlement Time</Label>
            <Input
              id="settleTime"
              name="settleTime"
              type="datetime-local"
              value={form.settleTime}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="userId">User ID (For Turnover)</Label>
            <Input
              id="userId"
              name="userId"
              type="number"
              value={form.userId}
              onChange={handleInputChange}
              placeholder="e.g., 32545526"
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
                <SelectItem value="1">Valid (1)</SelectItem>
                <SelectItem value="0">Running (0)</SelectItem>
                <SelectItem value="-1">Invalid (-1)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit" disabled={isLoading} className="mt-6 w-full md:w-auto">
          {isLoading ? "Creating..." : "Create Detailed Bet Record"}
        </Button>
      </form>
    </div>
  );
};

export default CreateBet;

