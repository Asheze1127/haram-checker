"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthGuard } from "@/components/auth-guard";

const allergens = [
  { id: "peanuts", label: "Peanuts" },
  { id: "tree-nuts", label: "Tree Nuts" },
  { id: "milk", label: "Milk" },
  { id: "eggs", label: "Eggs" },
  { id: "soy", label: "Soy" },
  { id: "wheat", label: "Wheat" },
  { id: "fish", label: "Fish" },
  { id: "shellfish", label: "Shellfish" },
  { id: "gluten", label: "Gluten" },
];

export default function SettingsPage() {
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

  const handleAllergenChange = (allergenId: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergenId)
        ? prev.filter((id) => id !== allergenId)
        : [...prev, allergenId]
    );
  };

  const handleSave = () => {
    // Here you would save the user's preferences
    alert(`Saved preferences: ${selectedAllergens.join(", ")}`);
  };

  return (
    <AuthGuard>
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Allergy Settings</CardTitle>
            <CardDescription>
              Select your allergies to get personalized results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {allergens.map((allergen) => (
              <div key={allergen.id} className="flex items-center space-x-2">
                <Checkbox
                  id={allergen.id}
                  checked={selectedAllergens.includes(allergen.id)}
                  onCheckedChange={() => handleAllergenChange(allergen.id)}
                />
                <Label
                  htmlFor={allergen.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {allergen.label}
                </Label>
              </div>
            ))}
          </div>
          <Button onClick={handleSave} className="w-full mt-6">
            Save Preferences
          </Button>
        </CardContent>
      </Card>
      </div>
    </AuthGuard>
  );
}
