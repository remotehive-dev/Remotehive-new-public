import { Card } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { forwardRef } from "react";
import Tilt from "react-parallax-tilt";

import { defaultTiltProps } from "@/client/constants/parallax-tilt";

type Props = {
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
};

export const BaseCard = forwardRef<HTMLDivElement, Props>(
  ({ children, className, onClick }, ref) => (
    <Tilt {...defaultTiltProps}>
      <Card
        ref={ref}
        className={cn(
          "relative flex aspect-[1/1.4142] scale-100 cursor-pointer items-center justify-center p-0 transition-transform active:scale-95",
          "bg-white border border-gray-100 shadow-sm hover:border-purple-200 hover:shadow-neu-flat rounded-xl transition-all duration-200",
          className,
        )}
        onClick={onClick}
      >
        {children}
      </Card>
    </Tilt>
  ),
);
