import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";

const hoverTap = {
  whileHover: { scale: 1.03, transition: { type: "spring", stiffness: 400, damping: 17 } },
  whileTap: { scale: 0.97 },
};

const subtleHover = {
  whileHover: { scale: 1.015, y: -2, transition: { type: "spring", stiffness: 300, damping: 20 } },
  whileTap: { scale: 0.99 },
};

/** Wrap any card for a subtle lift on hover + press feedback */
export function MotionCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div {...subtleHover} className={className}>
      {children}
    </motion.div>
  );
}

/** Wrap a button (or any small interactive element) for scale hover + tap */
export function MotionButton({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      {...hoverTap}
      className={className}
      onClick={onClick}
      style={{ display: "inline-flex" }}
    >
      {children}
    </motion.div>
  );
}

export { hoverTap, subtleHover };
