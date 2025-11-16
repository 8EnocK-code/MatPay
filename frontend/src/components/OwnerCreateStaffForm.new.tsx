// frontend/src/components/OwnerCreateStaffForm.new.tsx
// Form component for owner to create drivers/conductors
// Review and integrate into Owner.tsx as needed

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/api";

export function OwnerCreateStaffForm() {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"driver" | "conductor">("driver");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phoneNumber || !password) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setSubmitting(true);
      const result = await api("/owner/users", {
        method: "POST",
        body: { name, phoneNumber, password, role },
      });
      toast.success(`${role} created successfully`);
      // Reset form
      setName("");
      setPhoneNumber("");
      setPassword("");
      setRole("driver");
    } catch (err: any) {
      toast.error(`Failed to create ${role}: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <UserPlus className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">Create Staff Member</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="0712345678"
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={(v: "driver" | "conductor") => setRole(v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="driver">Driver</SelectItem>
              <SelectItem value="conductor">Conductor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Set password"
            className="mt-1"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating..." : "Create Staff Member"}
        </Button>
      </form>
    </Card>
  );
}

