import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

/**
 * Standard robust UI Button Component enforcing consistent styling 
 * and flexibility with Tailwind class merging.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
      outline: "border border-gray-300 bg-transparent hover:bg-gray-50",
      ghost: "hover:bg-gray-100 hover:text-gray-900",
    };

    const sizes = {
      sm: "h-9 px-3 text-sm",
      md: "h-10 py-2 px-4",
      lg: "h-11 px-8 text-lg",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
