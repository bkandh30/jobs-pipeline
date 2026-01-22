"use client";

import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SignUp() {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white p-4">
            <Card className="w-full max-w-md border-gray-200 shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="flex flex-col items-center text-2xl font-bold text-black">
                        Welcome back!
                    </CardTitle>
                    <CardDescription className="flex flex-col items-center text-gray-600">
                        Sign in to your account to continue.
                    </CardDescription>
                </CardHeader>
                <form>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-700">Email</Label>
                            <Input id="email" type="email" placeholder="john.doe@example.com" required className="border-gray-300 focus:border-primary focus:ring-primary" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-700">Password</Label>
                            <Input id="password" type="password" placeholder="********" required minLength={8} className="border-gray-300 focus:border-primary focus:ring-primary" />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pt-6">
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Create Account</Button>
                        <p className="text-center text-sm text-gray-600">Don&apos;t have an account? {" "} <Link href="/sign-up" className="font-medium text-primary hover:underline">Sign up for free</Link></p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}