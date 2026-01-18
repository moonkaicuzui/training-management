import { cva } from "class-variance-authority"

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-status-pass text-white",
        warning:
          "border-transparent bg-status-warning text-white",
        expired:
          "border-transparent bg-status-expired text-white",
        inactive:
          "border-transparent bg-status-inactive text-white",
        gradeAA:
          "border-transparent bg-grade-aa text-white",
        gradeA:
          "border-transparent bg-grade-a text-white",
        gradeB:
          "border-transparent bg-grade-b text-white",
        gradeC:
          "border-transparent bg-grade-c text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
