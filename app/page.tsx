"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

export default function HomePage() {
  const [productImage, setProductImage] = useState<File | null>(null);
  const [ingredientsImage, setIngredientsImage] = useState<File | null>(null);
  const [result, setResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProductImage(e.target.files[0]);
    }
  };

  const handleIngredientsImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files) {
      setIngredientsImage(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!productImage || !ingredientsImage) {
      alert("Please upload both images.");
      return;
    }
    setIsLoading(true);
    setResult("Analyzing...");

    // This is where you would call the Gemini API.
    // For now, we'll just simulate a delay and a mock response.
    setTimeout(() => {
      setResult("Mock analysis result: This product appears to be Halal. No allergens found based on your profile.");
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Haram & Allergen Checker</CardTitle>
          <CardDescription>
            Upload a photo of the product and its ingredients list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-3">
              <Label htmlFor="product-image">Product Image</Label>
              <Input id="product-image" type="file" onChange={handleProductImageChange} />
              {productImage && (
                <div className="mt-2 relative w-full h-48">
                    <Image src={URL.createObjectURL(productImage)} alt="Product Preview" layout="fill" objectFit="contain" />
                </div>
              )}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="ingredients-image">Ingredients Image</Label>
              <Input id="ingredients-image" type="file" onChange={handleIngredientsImageChange} />
               {ingredientsImage && (
                <div className="mt-2 relative w-full h-48">
                    <Image src={URL.createObjectURL(ingredientsImage)} alt="Ingredients Preview" layout="fill" objectFit="contain" />
                </div>
              )}
            </div>
          </div>
          <Separator className="my-6" />
          <Button onClick={handleSubmit} className="w-full" disabled={isLoading}>
            {isLoading ? "Analyzing..." : "Check Product"}
          </Button>
          {result && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold">Analysis Result:</h3>
              <p className="text-sm">{result}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}