import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-[background-color,border-color,box-shadow,transform,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:-translate-y-px hover:bg-blue-700 hover:shadow-[0_4px_10px_rgba(37,99,235,0.18)] active:translate-y-0 active:bg-blue-800 active:shadow-none disabled:bg-slate-300 disabled:text-slate-500",
        secondary: "bg-secondary text-secondary-foreground hover:bg-green-700",
        outline: "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
        ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
        destructive: "border border-red-200 bg-white text-destructive hover:bg-red-50",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-11 px-3",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
