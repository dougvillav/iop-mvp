import * as React from "react"
import { cn } from "@/lib/utils"

export interface AmountInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (value: string) => void;
}

const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  ({ className, type, onChange, value, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Remove leading zeros but keep one zero if the input is just "0" or starts with "0."
      if (inputValue.length > 1 && inputValue.startsWith('0') && !inputValue.startsWith('0.')) {
        inputValue = inputValue.replace(/^0+/, '');
      }
      
      // Ensure we don't end up with an empty string
      if (inputValue === '') {
        inputValue = '';
      }
      
      // Call the custom onChange handler if provided
      if (onChange) {
        onChange(inputValue);
      }
    };

    return (
      <input
        type={type || "number"}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        value={value}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
AmountInput.displayName = "AmountInput"

export { AmountInput }
