import { Briefcase } from "lucide-react";
import Link from "next/link";
import { Button } from "./button";

export default function Navbar() {
    return (
        <nav className="border-b border-gray-200 bg-white">
            <div className="container mx-auto flex h-16 items-center px-4">
                <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary">
                    <Briefcase />
                    Job Pipeline
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/sign-in">
                        <Button variant="ghost" className="text-gray-700 hover:text-black">Login</Button>
                    </Link>
                    <Link href="/sign-up">
                        <Button variant="default" className="bg-primary hover:bg-primary/90">Register for Free</Button>
                    </Link>
                </div>
            </div>
        </nav>
    )
}
